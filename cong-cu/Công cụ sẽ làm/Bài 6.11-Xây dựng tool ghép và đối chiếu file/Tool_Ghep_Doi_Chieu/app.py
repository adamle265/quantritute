# -*- coding: utf-8 -*-
"""
Tool Ghép & Đối Chiếu Excel — máy chủ xử lý dữ liệu (Flask + pandas).

Toàn bộ việc đọc file, kiểm tra khóa, ghép dữ liệu, tạo dữ liệu mẫu và xuất Excel
đều chạy ở đây. Giao diện (templates/index.html) chỉ hiển thị và gọi các API bên dưới.
"""
import io
import os
import re
import sys
import math
import time
import socket
import string
import random
import logging
import secrets
import threading
import traceback
import webbrowser
import unicodedata
from datetime import datetime, date

import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file, abort

# ---------------------------------------------------------------------------
# Cấu hình chung
# ---------------------------------------------------------------------------
MAX_UPLOAD_MB = 500
EXCEL_ROW_LIMIT = 1048575  # số dòng dữ liệu tối đa 1 sheet Excel cho phép (chưa tính dòng tiêu đề)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_MB * 1024 * 1024

log = logging.getLogger('ghep_doi_chieu')
logging.basicConfig(level=logging.INFO, format='%(asctime)s  %(message)s', datefmt='%H:%M:%S')

# Trạng thái xử lý — công cụ chạy 1 người dùng trên máy cá nhân nên dùng biến toàn cục.
STATE = {'A': None, 'B': None}
LAST_MERGE = {'value': None}
JOBS = {}
JOBS_LOCK = threading.Lock()
EXPORT_FILES = {}  # token -> {'bytes':..., 'filename':...}


class FriendlyError(Exception):
    """Lỗi có thông báo tiếng Việt thân thiện, hiển thị thẳng ra giao diện."""
    pass


# ---------------------------------------------------------------------------
# Xử lý lỗi -> thông báo tiếng Việt dễ hiểu
# ---------------------------------------------------------------------------
def friendly_message(e: Exception) -> str:
    if isinstance(e, FriendlyError):
        return str(e)
    if isinstance(e, MemoryError):
        return ('Máy tính không đủ bộ nhớ để xử lý file này. '
                'Vui lòng đóng bớt ứng dụng khác hoặc thử với file nhỏ hơn.')
    if isinstance(e, PermissionError):
        return ('Không thể đọc file — file có thể đang được mở trong Excel hoặc ứng dụng khác. '
                'Vui lòng đóng file đó rồi thử tải lên lại.')
    if isinstance(e, UnicodeDecodeError):
        return ('Không đọc được bảng mã của file CSV. '
                'Vui lòng mở file bằng Excel rồi lưu lại với bảng mã UTF-8, sau đó thử lại.')
    if isinstance(e, MemoryError):
        return 'Hết bộ nhớ khi xử lý file.'
    msg = str(e).strip()
    if not msg:
        msg = type(e).__name__
    return 'Đã có lỗi khi xử lý dữ liệu: ' + msg


# ---------------------------------------------------------------------------
# Định dạng hiển thị (để trả JSON đã "sẵn sàng hiển thị" giống hệt bản artifact)
# ---------------------------------------------------------------------------
def is_na_scalar(v) -> bool:
    if v is None:
        return True
    try:
        r = pd.isna(v)
        if isinstance(r, bool):
            return r
        return bool(r)
    except (TypeError, ValueError):
        return False


def fmt_num_vi(n) -> str:
    try:
        f = float(n)
    except (TypeError, ValueError):
        return str(n)
    if math.isnan(f):
        return ''
    neg = f < 0
    f = abs(f)
    is_int = abs(f - round(f)) < 1e-9
    if is_int:
        s = '{:,}'.format(int(round(f)))
    else:
        s = '{:,.2f}'.format(f).rstrip('0').rstrip('.')
        if ',' not in s.split('.')[0] and '.' not in s:
            pass
    # đổi dấu phẩy/chấm sang kiểu Việt Nam: nghìn = '.', thập phân = ','
    s = s.replace(',', '\x00').replace('.', ',').replace('\x00', '.')
    return ('-' if neg else '') + s


def fmt_date_vi(v):
    if isinstance(v, pd.Timestamp):
        if pd.isna(v):
            return ''
        return v.strftime('%d/%m/%Y')
    if isinstance(v, (datetime, date)):
        return v.strftime('%d/%m/%Y')
    return None


def fmt_cell_display(v) -> str:
    if is_na_scalar(v):
        return ''
    d = fmt_date_vi(v)
    if d is not None:
        return d
    if isinstance(v, (bool, np.bool_)):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float, np.integer, np.floating)):
        return fmt_num_vi(v)
    return str(v)


def to_jsonable(v):
    """Chuyển 1 giá trị ô dữ liệu (có thể là Timestamp/NaN/numpy...) sang chuỗi hiển thị an toàn cho JSON."""
    return fmt_cell_display(v)


# ---------------------------------------------------------------------------
# Đọc file (Excel bằng calamine, CSV tự dò bảng mã & dấu phân cách)
# ---------------------------------------------------------------------------
def read_workbook_all_sheets(file_bytes: bytes, filename: str):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in ('xlsx', 'xlsm', 'xls', 'xlsb'):
        bio = io.BytesIO(file_bytes)
        try:
            sheets = pd.read_excel(bio, sheet_name=None, header=None, engine='calamine')
        except Exception:
            bio.seek(0)
            try:
                sheets = pd.read_excel(bio, sheet_name=None, header=None)
            except Exception:
                raise FriendlyError(
                    'Không đọc được file "%s". File có thể bị hỏng hoặc không đúng định dạng Excel.' % filename)
        if not sheets:
            raise FriendlyError('File "%s" không có sheet dữ liệu nào.' % filename)
        return sheets, 'excel'
    elif ext == 'csv':
        df = read_csv_smart(file_bytes, filename)
        return {'Sheet1': df}, 'csv'
    else:
        raise FriendlyError('Định dạng file "%s" không được hỗ trợ. Vui lòng dùng .xlsx, .xls hoặc .csv.' % filename)


CSV_ENCODINGS = ['utf-8-sig', 'utf-8', 'windows-1258', 'cp1252']


def read_csv_smart(file_bytes: bytes, filename: str) -> pd.DataFrame:
    text = None
    for enc in CSV_ENCODINGS:
        try:
            text = file_bytes.decode(enc)
            break
        except (UnicodeDecodeError, LookupError):
            continue
    if text is None:
        raise FriendlyError(
            'Không đọc được bảng mã của file "%s". Vui lòng lưu lại file với bảng mã UTF-8 rồi thử lại.' % filename)

    sample_lines = text.splitlines()[:10]
    sample = '\n'.join(sample_lines)
    semi = sample.count(';')
    comma = sample.count(',')
    sep = ';' if semi > comma else ','

    try:
        df = pd.read_csv(
            io.StringIO(text), header=None, sep=sep, dtype=str,
            keep_default_na=False, na_values=[''], engine='python',
            on_bad_lines='skip',
        )
    except Exception:
        raise FriendlyError(
            'Không đọc được nội dung file "%s". Vui lòng kiểm tra lại định dạng CSV (dấu phân cách , hoặc ;).' % filename)
    return df


# ---------------------------------------------------------------------------
# Dò dòng tiêu đề, đặt tên cột, tách dữ liệu, đoán kiểu cột
# ---------------------------------------------------------------------------
def detect_header_row(raw_df: pd.DataFrame) -> int:
    limit = min(len(raw_df), 30)
    best, best_score = 0, -1
    for r in range(limit):
        row = raw_df.iloc[r]
        score = 0
        for v in row:
            if isinstance(v, str) and v.strip() != '':
                score += 1
        if score > best_score:
            best_score = score
            best = r
    return best


def dedupe_columns(header_vals) -> list:
    seen = {}
    out = []
    for i, v in enumerate(header_vals):
        if v is None or is_na_scalar(v) or str(v).strip() == '':
            base = 'Cột %d' % (i + 1)
        else:
            base = str(v).strip()
        cnt = seen.get(base, 0)
        name = base if cnt == 0 else '%s (%d)' % (base, cnt + 1)
        seen[base] = cnt + 1
        out.append(name)
    return out


def blank_mask_frame(df: pd.DataFrame) -> pd.Series:
    def cell_blank(v):
        if v is None:
            return True
        try:
            if pd.isna(v):
                return True
        except (TypeError, ValueError):
            pass
        if isinstance(v, str) and v.strip() == '':
            return True
        return False

    if df.shape[1] == 0:
        return pd.Series([], dtype=bool)
    mask = None
    for c in df.columns:
        col_mask = df[c].map(cell_blank)
        mask = col_mask if mask is None else (mask & col_mask)
    return mask


NUM_RE = re.compile(r'^-?\d+(\.\d+)?$')
LEADING_ZERO_RE = re.compile(r'^0\d')


def coerce_csv_column(col: pd.Series):
    """CSV không có kiểu dữ liệu gốc — thử nhận diện số/ngày cho từng cột (không đụng vào mã có số 0 ở đầu)."""
    non_null = col.dropna()
    if len(non_null) == 0:
        return col
    vals = non_null.astype(str).str.strip()
    if (vals.str.match(LEADING_ZERO_RE)).any():
        return col  # có mã kiểu "0012" -> giữ nguyên dạng chữ, không ép thành số
    numeric = pd.to_numeric(vals.str.replace(',', '', regex=False), errors='coerce')
    if numeric.notna().all():
        out = pd.to_numeric(col.astype(str).str.strip().str.replace(',', '', regex=False), errors='coerce')
        return out
    dt = pd.to_datetime(vals, errors='coerce', dayfirst=True)
    if dt.notna().mean() >= 0.95:
        out = pd.to_datetime(col.astype(str).str.strip(), errors='coerce', dayfirst=True)
        return out
    return col


def guess_col_type(col: pd.Series) -> str:
    sample = col.dropna()
    if len(sample) > 300:
        sample = sample.iloc[:300]
    total = len(sample)
    if total == 0:
        return 'text'
    n_num = 0
    n_date = 0
    for v in sample:
        if isinstance(v, (datetime, date, pd.Timestamp)):
            n_date += 1
        elif isinstance(v, bool) or isinstance(v, np.bool_):
            pass
        elif isinstance(v, (int, float, np.integer, np.floating)):
            n_num += 1
    if n_date / total > 0.5:
        return 'date'
    if n_num / total > 0.5:
        return 'number'
    return 'text'


def slice_data_and_type(raw_df: pd.DataFrame, header_row: int, is_csv: bool):
    header_vals = raw_df.iloc[header_row].tolist()
    columns = dedupe_columns(header_vals)
    data = raw_df.iloc[header_row + 1:].reset_index(drop=True)
    data.columns = columns
    if len(data) > 0:
        blank = blank_mask_frame(data)
        data = data[~blank.values].reset_index(drop=True)
    if is_csv:
        for c in columns:
            data[c] = coerce_csv_column(data[c])
    col_types = [guess_col_type(data[c]) for c in columns]
    return data, columns, col_types


def dataframe_preview_records(df: pd.DataFrame, columns, n=5):
    head = df.head(n)
    records = []
    for _, row in head.iterrows():
        rec = {}
        for c in columns:
            rec[c] = to_jsonable(row[c])
        records.append(rec)
    return records


# ---------------------------------------------------------------------------
# Làm sạch khóa & ghép dữ liệu (thao tác theo cột — không lặp từng dòng)
# ---------------------------------------------------------------------------
WS_RE = re.compile(r'[\s  ᠎ -‍  ⁠　﻿]+')
NUMERIC_KEY_RE = re.compile(r'^-?\d+(\.\d+)?$')


def clean_series(s: pd.Series, opts: dict) -> pd.Series:
    s = s.astype('string')
    s = s.fillna('')
    if opts.get('trimSpaces'):
        s = s.str.replace(WS_RE, ' ', regex=True).str.strip()
    if opts.get('normalizeUnicode'):
        s = s.str.normalize('NFC')
    if opts.get('caseInsensitive'):
        s = s.str.casefold()
    if opts.get('numericEquivalence'):
        is_num = s.str.match(NUMERIC_KEY_RE)
        if is_num.any():
            nums = pd.to_numeric(s.where(is_num), errors='coerce')

            def canon(x):
                if pd.isna(x):
                    return None
                if float(x).is_integer():
                    return str(int(x))
                return ('%r' % float(x))

            canon_s = nums.map(canon)
            s = s.mask(is_num & canon_s.notna(), canon_s)
    return s


def build_composite_key(df: pd.DataFrame, cols: list, opts: dict, side_tag: str):
    """Trả về (key_series, empty_mask). Khóa trống được thay bằng giá trị duy nhất theo từng dòng
    để không bao giờ trùng với dòng trống khác (kể cả ở file còn lại)."""
    parts = [clean_series(df[c], opts) for c in cols]
    if len(parts) == 1:
        combined = parts[0]
    else:
        combined = parts[0]
        for p in parts[1:]:
            combined = combined + '\x01' + p
    empty_mask = parts[0] == ''
    for p in parts[1:]:
        empty_mask = empty_mask & (p == '')
    idx = pd.Series(np.arange(len(df)), index=df.index).astype(str)
    sentinel = ('\x02__EMPTY_%s_' % side_tag) + idx
    key = combined.mask(empty_mask, other=sentinel)
    return key, empty_mask


def is_blank_value_series(s: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(s) or pd.api.types.is_datetime64_any_dtype(s):
        return s.isna()

    def blank1(v):
        return is_na_scalar(v) or (isinstance(v, str) and v.strip() == '')

    return s.map(blank1)


def to_num_maybe_series(s: pd.Series):
    """Trả về Series số (float) nếu ép được, None với những ô không ép được / không phải số."""
    def conv(v):
        if isinstance(v, bool):
            return np.nan
        if isinstance(v, (int, float, np.integer, np.floating)):
            f = float(v)
            return np.nan if math.isnan(f) else f
        if isinstance(v, str):
            t = v.strip().replace(' ', '').replace(',', '')
            if NUM_RE.match(t):
                try:
                    return float(t)
                except ValueError:
                    return np.nan
        return np.nan

    return s.map(conv)


def build_output_plan(a_columns, b_columns, key_pairs, colsA, colsB, reserved_names=None):
    """reserved_names: tên cột do chính công cụ dùng (vd 'Trạng thái', 'Chi tiết lệch' ở kiểu ghép 7).
    Nếu dữ liệu gốc của người dùng đã có sẵn cột trùng tên với những tên này (vd file đơn hàng có
    sẵn cột "Trạng thái" là trạng thái đơn hàng), tự thêm " (A)"/" (B)" giống hệt cách xử lý trùng
    tên giữa 2 file — để không bị lỗi trùng cột khi ghép thêm cột trạng thái đối chiếu của công cụ."""
    reserved_names = reserved_names or set()
    a_key_names = [p['a'] for p in key_pairs]
    b_key_names = [p['b'] for p in key_pairs]
    sel_a = [c for c in (list(a_columns) if colsA == 'ALL' else colsA) if c not in a_key_names]
    sel_b = [c for c in (list(b_columns) if colsB == 'ALL' else colsB) if c not in b_key_names]
    sel_a = [c for c in sel_a if c in a_columns]
    sel_b = [c for c in sel_b if c in b_columns]
    a_out_names = {c: (c + ' (A)' if (c in sel_b or c in reserved_names) else c) for c in sel_a}
    b_out_names = {c: (c + ' (B)' if (c in sel_a or c in reserved_names) else c) for c in sel_b}
    key_out_names = a_key_names[:]
    return {
        'a_key_names': a_key_names, 'b_key_names': b_key_names,
        'sel_a': sel_a, 'sel_b': sel_b,
        'a_out_names': a_out_names, 'b_out_names': b_out_names,
        'key_out_names': key_out_names,
    }


def prep_working_frame(df: pd.DataFrame, key_names, key_prefix, out_names_map, key_col):
    """Tạo bản dữ liệu rút gọn: cột khóa gốc (để gộp), khóa sạch, và các cột sẽ xuất ra kết quả."""
    w = pd.DataFrame(index=df.index)
    for i, kc in enumerate(key_names):
        w['__korig_%s%d__' % (key_prefix, i)] = df[kc]
    for src, out in out_names_map.items():
        w[out] = df[src]
    w['__key__'] = key_col
    return w


def coalesce_key_columns(df: pd.DataFrame, n_keys: int, key_out_names, key_prefix_a='a', key_prefix_b='b'):
    for i in range(n_keys):
        ca = '__korig_%s%d__' % (key_prefix_a, i)
        cb = '__korig_%s%d__' % (key_prefix_b, i)
        av = df[ca] if ca in df.columns else pd.Series([None] * len(df), index=df.index)
        bv = df[cb] if cb in df.columns else pd.Series([None] * len(df), index=df.index)
        blank_a = is_blank_value_series(av)
        coalesced = av.where(~blank_a, bv)
        df[key_out_names[i]] = coalesced
    drop_cols = [c for c in df.columns if c.startswith('__korig_')]
    return df.drop(columns=drop_cols)


def run_merge_core(A_data: pd.DataFrame, B_data: pd.DataFrame, config: dict, progress):
    key_pairs = config['keyPairs']
    clean_opts = config['clean']
    dup_mode = config.get('duplicateHandling', 'first')
    join_type = int(config['joinType'])
    colsA = config.get('colsA', 'ALL')
    colsB = config.get('colsB', 'ALL')
    compare_pairs = config.get('comparePairs') or []

    progress('Đang chuẩn hoá khóa...', 10)
    a_key_cols = [p['a'] for p in key_pairs]
    b_key_cols = [p['b'] for p in key_pairs]
    keyA, emptyA_mask = build_composite_key(A_data, a_key_cols, clean_opts, 'A')
    keyB, emptyB_mask = build_composite_key(B_data, b_key_cols, clean_opts, 'B')

    # Kiểu ghép 7 sẽ tự thêm 2 cột "Trạng thái"/"Chi tiết lệch" — nếu dữ liệu gốc đã có sẵn cột
    # trùng tên (vd file đơn hàng có sẵn cột "Trạng thái" đơn hàng), phải đổi tên cột gốc đó
    # thành " (A)"/" (B)" trước, tránh bị lỗi trùng cột khi ghép.
    reserved_names = {'Trạng thái', 'Chi tiết lệch'} if join_type == 7 else set()
    plan = build_output_plan(A_data.columns, B_data.columns, key_pairs, colsA, colsB, reserved_names)
    n_keys = len(key_pairs)

    progress('Đang lập bảng dữ liệu làm việc...', 25)
    Aw = prep_working_frame(A_data, plan['a_key_names'], 'a', plan['a_out_names'], keyA)
    Bw = prep_working_frame(B_data, plan['b_key_names'], 'b', plan['b_out_names'], keyB)

    def effective_lookup(w):
        if dup_mode == 'first':
            return w.drop_duplicates(subset='__key__', keep='first')
        return w

    progress('Đang ghép dữ liệu...', 45)
    mismatch_count = 0

    if join_type in (5, 6):
        base = Aw if join_type == 5 else Bw
        other = Bw if join_type == 5 else Aw
        other_keys = set(other['__key__'].tolist())
        keep = ~base['__key__'].isin(other_keys)
        out = base[keep].copy()
        # bù cột rỗng phía còn lại để giữ đủ khung cột như bên JS
        if join_type == 5:
            for c in plan['b_out_names'].values():
                out[c] = None
        else:
            for c in plan['a_out_names'].values():
                out[c] = None
        out = coalesce_key_columns(out, n_keys, plan['key_out_names'])
        matched_count, only_a_count, only_b_count = 0, (len(out) if join_type == 5 else 0), (len(out) if join_type == 6 else 0)
        result_df = out
        status_series = None
    else:
        if join_type == 2:
            base, lookup = Bw, Aw
        else:
            base, lookup = Aw, Bw
        lookup_eff = effective_lookup(lookup)
        how = 'inner' if join_type == 3 else 'left'
        need_indicator = join_type in (1, 2, 4, 7)
        merged = pd.merge(base, lookup_eff, how=how, on='__key__', indicator=need_indicator)
        progress('Đang ghép dữ liệu...', 65)

        if join_type in (4, 7):
            base_keys = set(base['__key__'].tolist())
            only_other = lookup[~lookup['__key__'].isin(base_keys)].copy()
            for c in merged.columns:
                if c not in only_other.columns and c != '_merge':
                    only_other[c] = None
            status_matched = merged['_merge'].map({'both': 'Khớp', 'left_only': 'Chỉ có ở A' if join_type != 2 else 'Chỉ có ở B'})
            merged = merged.drop(columns='_merge')
            only_other['__status__'] = 'Chỉ có ở B' if base is Aw else 'Chỉ có ở A'
            merged['__status__'] = status_matched.values
            result_df = pd.concat([merged, only_other], ignore_index=True, sort=False)
        elif join_type in (1, 2):
            # Bên trái (base) giữ đủ; đánh dấu dòng nào thực sự khớp để tính đúng thống kê
            # (không hiện cột Trạng thái ra kết quả — chỉ dùng nội bộ để đếm).
            only_label = 'Chỉ có ở A' if join_type == 1 else 'Chỉ có ở B'
            status_matched = merged['_merge'].map({'both': 'Khớp', 'left_only': only_label})
            merged = merged.drop(columns='_merge')
            merged['__status__'] = status_matched.values
            result_df = merged
        else:
            result_df = merged
            result_df['__status__'] = None

        only_a_count = int((result_df['__status__'] == 'Chỉ có ở A').sum()) if '__status__' in result_df else 0
        only_b_count = int((result_df['__status__'] == 'Chỉ có ở B').sum()) if '__status__' in result_df else 0
        matched_count = len(result_df) - only_a_count - only_b_count if join_type in (1, 2, 4, 7) else len(result_df)

        result_df = coalesce_key_columns(result_df, n_keys, plan['key_out_names'])
        status_series = result_df.pop('__status__') if '__status__' in result_df.columns else None
        if join_type != 7:
            # Cột trạng thái chỉ hiển thị ra kết quả với kiểu ghép 7 (báo cáo tra soát);
            # với các kiểu khác nó chỉ được dùng nội bộ ở trên để tính đúng thống kê.
            status_series = None

    progress('Đang xử lý kết quả...', 85)

    # So sánh giá trị (chỉ áp dụng cho kiểu 7, trên các dòng đã khớp)
    detail_series = None
    if join_type == 7 and compare_pairs and status_series is not None:
        matched_idx = status_series[status_series == 'Khớp'].index
        detail = pd.Series([''] * len(result_df), index=result_df.index, dtype=object)
        mismatch_any = pd.Series(False, index=result_df.index)
        for cp in compare_pairs:
            a_col_name = plan['a_out_names'].get(cp.get('aCol'), cp.get('aCol'))
            b_col_name = plan['b_out_names'].get(cp.get('bCol'), cp.get('bCol'))
            if a_col_name not in result_df.columns or b_col_name not in result_df.columns:
                continue
            label = a_col_name if cp.get('aCol') == cp.get('bCol') else ('%s / %s' % (cp.get('aCol'), cp.get('bCol')))
            tol = cp.get('tolerance')
            tol = float(tol) if (tol is not None and str(tol) != '') else 0.0
            sub_a = result_df.loc[matched_idx, a_col_name]
            sub_b = result_df.loc[matched_idx, b_col_name]
            num_a = to_num_maybe_series(sub_a)
            num_b = to_num_maybe_series(sub_b)
            both_num = num_a.notna() & num_b.notna()
            diff = (num_a - num_b).abs()
            mism_num = both_num & (diff > tol)

            clean_a = clean_series(sub_a.astype('string'), {'trimSpaces': True, 'caseInsensitive': True, 'normalizeUnicode': True, 'numericEquivalence': False})
            clean_b = clean_series(sub_b.astype('string'), {'trimSpaces': True, 'caseInsensitive': True, 'normalizeUnicode': True, 'numericEquivalence': False})
            mism_text = (~both_num) & (clean_a != clean_b)

            mism = mism_num | mism_text
            if mism.any():
                mismatch_any.loc[mism[mism].index] = True
                for idx in mism[mism].index:
                    if mism_num.get(idx, False):
                        txt = '%s: %s ≠ %s, chênh %s' % (
                            label, fmt_num_vi(num_a.loc[idx]), fmt_num_vi(num_b.loc[idx]),
                            fmt_num_vi(abs(num_a.loc[idx] - num_b.loc[idx])))
                    else:
                        va = sub_a.loc[idx]
                        vb = sub_b.loc[idx]
                        txt = '%s: "%s" ≠ "%s"' % (label, '' if is_na_scalar(va) else va, '' if is_na_scalar(vb) else vb)
                    detail.loc[idx] = (detail.loc[idx] + '; ' + txt) if detail.loc[idx] else txt
        mismatch_count = int(mismatch_any.sum())
        status_series.loc[mismatch_any[mismatch_any].index] = 'Lệch giá trị'
        detail_series = detail

    out_columns = plan['key_out_names'] + list(plan['a_out_names'].values()) + list(plan['b_out_names'].values())
    result_df = result_df[out_columns] if len(result_df) else result_df.reindex(columns=out_columns)

    if status_series is not None:
        # Phòng hờ tuyệt đối: nếu vì lý do gì đó (vd cột khóa trùng tên) mà 'Trạng thái'/'Chi tiết
        # lệch' vẫn còn trùng với cột đã có, đổi sang tên khác thay vì để công cụ báo lỗi/dừng lại.
        status_col_name = 'Trạng thái'
        while status_col_name in result_df.columns:
            status_col_name += ' (đối chiếu)'
        detail_col_name = 'Chi tiết lệch'
        while detail_col_name in result_df.columns or detail_col_name == status_col_name:
            detail_col_name += ' (đối chiếu)'
        result_df.insert(0, status_col_name, status_series.values if hasattr(status_series, 'values') else status_series)
        result_df.insert(1, detail_col_name, (detail_series.values if detail_series is not None else ['' ] * len(result_df)))

    return result_df, {
        'totalRows': int(len(result_df)),
        'matchedCount': int(matched_count),
        'onlyACount': int(only_a_count),
        'onlyBCount': int(only_b_count),
        'mismatchCount': int(mismatch_count),
        'exceedsExcelLimit': len(result_df) > EXCEL_ROW_LIMIT,
        'hasCompare': join_type == 7 and bool(compare_pairs),
    }, plan


# ---------------------------------------------------------------------------
# Dữ liệu mẫu
# ---------------------------------------------------------------------------
def make_sample_dataframes():
    rnd = random.Random()
    HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý']
    TEN = ['Văn An', 'Thị Bình', 'Minh Châu', 'Thu Duyên', 'Quốc Đạt', 'Thị Giang', 'Hữu Hải', 'Thanh Huyền',
           'Đức Khang', 'Ngọc Lan', 'Văn Long', 'Thị Mai', 'Hoàng Nam', 'Kim Oanh', 'Tấn Phát', 'Thu Quỳnh',
           'Văn Sơn', 'Thị Thảo', 'Anh Tuấn', 'Bích Vân']
    KV = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nghệ An', 'Bình Dương', 'Khánh Hoà']
    CTY = ['Công ty TNHH', 'Công ty CP', 'DNTN']
    NGANH = ['Thương mại', 'Xây dựng', 'Thực phẩm', 'Vận tải', 'Nội thất', 'Công nghệ']

    codes = []
    cust_rows = []
    for i in range(1, 301):
        code = 'KH%04d' % i
        codes.append(code)
        is_biz = rnd.random() < 0.35
        name = (rnd.choice(CTY) + ' ' + rnd.choice(HO) + ' ' + rnd.choice(NGANH)) if is_biz else (
            rnd.choice(HO) + ' ' + rnd.choice(TEN))
        created = datetime(2023, rnd.randint(1, 12), rnd.randint(1, 28))
        cust_rows.append([code, name, rnd.choice(KV), 'Doanh nghiệp' if is_biz else 'Cá nhân', created])
    for idx in (7, 32, 88, 150, 210):
        cust_rows[idx][0] = ' ' + cust_rows[idx][0] + '  '
    for idx in (15, 60, 140):
        cust_rows[idx][0] = cust_rows[idx][0].lower()
    for idx in (20, 120, 260):
        dup = list(cust_rows[idx])
        dup[1] = rnd.choice(HO) + ' ' + rnd.choice(TEN) + ' (trùng mã)'
        cust_rows.append(dup)

    cust_header = ['Mã KH', 'Tên khách hàng', 'Khu vực', 'Loại khách', 'Ngày tạo']
    cust_aoa = [['DANH MỤC KHÁCH HÀNG - CẬP NHẬT 09/2026'], [None] * 5, cust_header] + cust_rows
    cust_df = pd.DataFrame(cust_aoa)

    SP = [('Bàn phím cơ', 350000), ('Chuột không dây', 180000), ('Màn hình 24 inch', 2800000),
          ('Ghế văn phòng', 1450000), ('Đèn bàn LED', 220000), ('Ổ cứng SSD 512GB', 890000),
          ('Webcam Full HD', 420000), ('Tai nghe chụp tai', 560000), ('Bàn nâng hạ', 3200000),
          ('Loa vi tính mini', 150000), ('Túi đựng laptop', 280000), ('Sạc dự phòng', 260000)]
    ord_rows = []
    for j in range(1, 2001):
        so = 'DH%05d' % j
        ngay = datetime(2026, rnd.randint(3, 9), rnd.randint(1, 28))
        r = rnd.random()
        if r < 0.03:
            code2 = 'KH%d' % rnd.randint(9001, 9099)
        else:
            code2 = rnd.choice(codes)
        if rnd.random() < 0.04:
            code2 = code2.lower()
        if rnd.random() < 0.04:
            code2 = ' ' + code2 + ' '
        sp, dg = rnd.choice(SP)
        sl = rnd.randint(1, 20)
        ord_rows.append([so, ngay, code2, sp, sl, dg, sl * dg])
    ord_header = ['Số đơn hàng', 'Ngày đặt', 'Mã khách hàng', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']
    ord_aoa = [['BÁO CÁO ĐƠN HÀNG'], [None] * 7, ord_header] + ord_rows
    ord_df = pd.DataFrame(ord_aoa)

    return ord_df, cust_df


# ---------------------------------------------------------------------------
# Xuất Excel (xlsxwriter + conditional formatting để nhanh với file lớn)
# ---------------------------------------------------------------------------
STATUS_COLORS = {
    'Khớp': '#E3F3E6',
    'Lệch giá trị': '#FFF3C4',
    'Chỉ có ở A': '#FBE0DE',
    'Chỉ có ở B': '#DCEBFB',
}
JOIN_LABELS = {
    1: 'Giữ đủ File A, lấy thêm thông tin từ File B',
    2: 'Giữ đủ File B, lấy thêm thông tin từ File A',
    3: 'Chỉ lấy dòng có ở cả 2 file',
    4: 'Gộp tất cả, không bỏ sót dòng nào',
    5: 'Dòng có ở A nhưng B không có',
    6: 'Dòng có ở B nhưng A không có',
    7: 'Báo cáo tra soát toàn diện',
}


def sanitize_sheet_name(name: str) -> str:
    s = re.sub(r'[:\\/\?\*\[\]]', '-', str(name))
    if len(s) > 31:
        s = s[:31]
    return s or 'Sheet'


def values_for_write(series: pd.Series) -> list:
    """Chuyển 1 cột thành list giá trị Python thuần, thay NaN/NaT/None bằng None (ô trống)
    — để ghi thẳng bằng xlsxwriter (nhanh hơn nhiều so với DataFrame.to_excel với file lớn)."""
    out = []
    for v in series.tolist():
        if v is None:
            out.append(None)
            continue
        try:
            if pd.isna(v):
                out.append(None)
                continue
        except (TypeError, ValueError):
            pass
        if isinstance(v, (np.integer,)):
            out.append(int(v))
        elif isinstance(v, (np.floating,)):
            out.append(float(v))
        elif isinstance(v, (np.bool_,)):
            out.append(bool(v))
        else:
            out.append(v)
    return out


def write_data_sheet(writer, base_name, df: pd.DataFrame, col_types_by_name, include_status, progress=None):
    n = len(df)
    chunks = []
    if n == 0:
        chunks.append(df)
    else:
        for i in range(0, n, EXCEL_ROW_LIMIT):
            chunks.append(df.iloc[i:i + EXCEL_ROW_LIMIT])

    book = writer.book
    header_fmt = book.add_format({'bold': True, 'bg_color': '#BFE3C8', 'font_color': '#16401F', 'border': 0})
    date_fmt = book.add_format({'num_format': 'dd/mm/yyyy'})
    status_fmts = {k: book.add_format({'bg_color': v}) for k, v in STATUS_COLORS.items()}

    for ci, chunk in enumerate(chunks):
        name = sanitize_sheet_name(base_name if len(chunks) == 1 else ('%s %d' % (base_name, ci + 1)))
        n_rows = len(chunk)
        n_cols = len(chunk.columns)
        # Ghi thẳng bằng xlsxwriter theo từng cột (write_column) thay vì DataFrame.to_excel —
        # nhanh hơn đáng kể với file lớn vì tránh được lớp bọc/ chuyển đổi kiểu dữ liệu của pandas.
        ws = writer.book.add_worksheet(name)
        writer.sheets[name] = ws
        ws.write_row(0, 0, [str(c) for c in chunk.columns], header_fmt)
        for c, col_name in enumerate(chunk.columns):
            base_type = col_types_by_name.get(col_name)
            fmt = date_fmt if base_type == 'date' else None
            if n_rows > 0:
                ws.write_column(1, c, values_for_write(chunk[col_name]), fmt)
        ws.freeze_panes(1, 0)
        if n_rows >= 0:
            ws.autofilter(0, 0, max(n_rows, 0), max(n_cols - 1, 0))
        for c, col_name in enumerate(chunk.columns):
            try:
                sample = chunk[col_name].astype(str).str.len()
                max_len = int(sample.max()) if len(sample) else 0
            except Exception:
                max_len = 12
            width = min(max(max_len + 2, len(str(col_name)) + 2, 11), 42)
            ws.set_column(c, c, width)
            base_type = col_types_by_name.get(col_name)
            if base_type == 'date':
                ws.set_column(c, c, width, date_fmt)
        if include_status and n_rows > 0:
            last_row_excel = n_rows  # header ở dòng 0 (Excel row1); dữ liệu từ Excel row2..
            for status, fmt in status_fmts.items():
                ws.conditional_format(1, 0, last_row_excel, n_cols - 1, {
                    'type': 'formula',
                    'criteria': '=$A2="%s"' % status,
                    'format': fmt,
                })
        if progress:
            progress(None, None)


def build_summary_rows(config, stats, file_info_a, file_info_b, join_label):
    rows = [('THÔNG TIN GHÉP & ĐỐI CHIẾU DỮ LIỆU', '')]
    rows.append(('Thời điểm xuất file', datetime.now().strftime('%H:%M:%S %d/%m/%Y')))
    rows.append(('', ''))
    rows.append(('File A', '%s  (sheet: %s, dòng tiêu đề: %s)' % (
        file_info_a['fileName'], file_info_a['sheetName'], file_info_a['headerRowDisplay'])))
    rows.append(('Số dòng / cột File A', '%d dòng, %d cột' % (file_info_a['rowCount'], file_info_a['colCount'])))
    rows.append(('File B', '%s  (sheet: %s, dòng tiêu đề: %s)' % (
        file_info_b['fileName'], file_info_b['sheetName'], file_info_b['headerRowDisplay'])))
    rows.append(('Số dòng / cột File B', '%d dòng, %d cột' % (file_info_b['rowCount'], file_info_b['colCount'])))
    rows.append(('', ''))
    rows.append(('Cặp cột khóa', ' ;  '.join('%s  =  %s' % (p['a'], p['b']) for p in config['keyPairs'])))
    clean_txt = []
    c = config['clean']
    if c.get('trimSpaces'): clean_txt.append('Bỏ khoảng trắng thừa')
    if c.get('caseInsensitive'): clean_txt.append('Không phân biệt hoa/thường')
    if c.get('normalizeUnicode'): clean_txt.append('Đồng nhất Unicode tiếng Việt')
    if c.get('numericEquivalence'): clean_txt.append('Coi số dạng chữ và số là một')
    rows.append(('Tuỳ chọn làm sạch khóa', ', '.join(clean_txt) if clean_txt else '(không bật tuỳ chọn nào)'))
    rows.append(('Xử lý khóa trùng', 'Lấy đủ tất cả các dòng' if config.get('duplicateHandling') == 'all' else 'Chỉ lấy dòng đầu tiên (giống VLOOKUP)'))
    rows.append(('Kiểu ghép đã chọn', join_label))
    rows.append(('', ''))
    rows.append(('Tổng số dòng kết quả', stats['totalRows']))
    rows.append(('Số dòng khớp', stats['matchedCount']))
    rows.append(('Chỉ có ở File A', stats['onlyACount']))
    rows.append(('Chỉ có ở File B', stats['onlyBCount']))
    if stats.get('hasCompare'):
        rows.append(('Số dòng lệch giá trị', stats['mismatchCount']))
    rows.append(('Thời gian xử lý', '%.2f giây' % (stats.get('elapsedMs', 0) / 1000.0)))
    if stats.get('exceedsExcelLimit'):
        rows.append(('CẢNH BÁO', 'Kết quả vượt quá %s dòng — giới hạn tối đa của 1 sheet Excel. '
                                  'Dữ liệu đã được tách sang nhiều sheet liên tiếp.' % fmt_num_vi(EXCEL_ROW_LIMIT)))
    return rows


def export_to_excel_bytes(result_df, out_columns, out_col_types, config, stats, plan, join_type, file_info_a, file_info_b, progress):
    progress('Đang tạo workbook...', 10)
    bio = io.BytesIO()
    col_types_by_name = dict(zip(out_columns, out_col_types))
    # Lấy tên cột "Trạng thái"/"Chi tiết lệch" THỰC TẾ theo vị trí (luôn được insert ở cột 0 và 1
    # trong run_merge_core) thay vì tên chữ cố định — để không bao giờ lỗi/lệch dữ liệu ngay cả
    # trong trường hợp cực hiếm tên bị đổi do trùng với cột khóa của người dùng.
    status_col_actual = result_df.columns[0] if join_type == 7 else None
    detail_col_actual = result_df.columns[1] if join_type == 7 else None
    if join_type == 7:
        col_types_by_name[status_col_actual] = 'text'
        col_types_by_name[detail_col_actual] = 'text'

    with pd.ExcelWriter(bio, engine='xlsxwriter') as writer:
        join_label = JOIN_LABELS.get(join_type, '')
        summary_rows = build_summary_rows(config, stats, file_info_a, file_info_b, join_label)
        ws_sum = writer.book.add_worksheet(sanitize_sheet_name('Tổng hợp'))
        bold = writer.book.add_format({'bold': True})
        ws_sum.set_column(0, 0, 34)
        ws_sum.set_column(1, 1, 70)
        for r, (label, value) in enumerate(summary_rows):
            ws_sum.write(r, 0, label, bold if label.isupper() or label == '' else None)
            ws_sum.write(r, 1, value)

        progress('Đang ghi dữ liệu...', 30)
        if join_type == 7:
            buckets = [
                ('Tất cả', result_df),
                ('Khớp', result_df[result_df[status_col_actual] == 'Khớp']),
                ('Lệch giá trị', result_df[result_df[status_col_actual] == 'Lệch giá trị']),
                ('Chỉ có ở A', result_df[result_df[status_col_actual] == 'Chỉ có ở A']),
                ('Chỉ có ở B', result_df[result_df[status_col_actual] == 'Chỉ có ở B']),
            ]
            step = 50 / max(len(buckets), 1)
            p = 30
            for name, sub in buckets:
                write_data_sheet(writer, name, sub.reset_index(drop=True), col_types_by_name, True)
                p += step
                progress('Đang ghi sheet "%s"...' % name, min(int(p), 85))
        else:
            write_data_sheet(writer, 'Kết quả', result_df.reset_index(drop=True), col_types_by_name, False)
            progress('Đang ghi dữ liệu...', 80)

    progress('Đang đóng gói file...', 95)
    bio.seek(0)
    return bio.read()


# ---------------------------------------------------------------------------
# Cơ chế job nền + báo tiến trình (giao diện gọi định kỳ để hỏi trạng thái)
# ---------------------------------------------------------------------------
def start_job(target, *args, **kwargs):
    job_id = secrets.token_hex(12)
    with JOBS_LOCK:
        JOBS[job_id] = {'state': 'running', 'message': 'Đang xử lý...', 'percent': 0, 'result': None, 'error': None}

    def make_progress():
        def progress(message=None, percent=None):
            with JOBS_LOCK:
                job = JOBS.get(job_id)
                if not job:
                    return
                if message is not None:
                    job['message'] = message
                if percent is not None:
                    job['percent'] = percent
        return progress

    def runner():
        try:
            result = target(make_progress(), *args, **kwargs)
            with JOBS_LOCK:
                JOBS[job_id]['state'] = 'done'
                JOBS[job_id]['result'] = result
                JOBS[job_id]['percent'] = 100
                JOBS[job_id]['message'] = 'Hoàn tất'
        except Exception as e:
            log.error('Job lỗi: %s\n%s', e, traceback.format_exc())
            with JOBS_LOCK:
                JOBS[job_id]['state'] = 'error'
                JOBS[job_id]['error'] = friendly_message(e)

    th = threading.Thread(target=runner, daemon=True)
    th.start()
    return job_id


@app.route('/api/job/<job_id>', methods=['GET'])
def api_job_status(job_id):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return jsonify({'state': 'error', 'error': 'Không tìm thấy tiến trình.'}), 404
        return jsonify({k: v for k, v in job.items() if k != 'result'} | ({'result': job['result']} if job['state'] == 'done' else {}))


# ---------------------------------------------------------------------------
# Các job xử lý
# ---------------------------------------------------------------------------
def job_load_file(progress, slot, filename, file_bytes):
    progress('Đang đọc file...', 15)
    sheets_raw, kind = read_workbook_all_sheets(file_bytes, filename)
    progress('Đang xử lý dữ liệu...', 70)
    STATE[slot] = {
        'fileName': filename, 'kind': kind, 'sheets_raw': sheets_raw,
        'sheetName': None, 'headerRow': None, 'columns': None, 'colTypes': None, 'data_df': None,
    }
    LAST_MERGE['value'] = None
    return {'sheetNames': list(sheets_raw.keys()), 'fileName': filename}


def build_sheet_info(slot):
    st = STATE[slot]
    data_df = st['data_df']
    preview = dataframe_preview_records(data_df, st['columns'], 5)
    return {
        'fileName': st['fileName'], 'sheetNames': list(st['sheets_raw'].keys()), 'sheetName': st['sheetName'],
        'headerRow': st['headerRow'], 'headerRowDisplay': st['headerRow'] + 1,
        'autoDetectedHeaderRow': st.get('autoDetected', False),
        'columns': st['columns'], 'colTypes': st['colTypes'], 'colCount': len(st['columns']),
        'rowCount': int(len(data_df)), 'preview': preview,
    }


def job_load_sheet(progress, slot, sheet_name, header_row):
    st = STATE.get(slot)
    if not st:
        raise FriendlyError('Chưa tải file cho vị trí %s.' % slot)
    if sheet_name not in st['sheets_raw']:
        raise FriendlyError('Sheet "%s" không tồn tại trong file.' % sheet_name)
    progress('Đang đọc sheet...', 25)
    raw_df = st['sheets_raw'][sheet_name]
    if raw_df.shape[0] == 0:
        raise FriendlyError('Sheet "%s" không có dữ liệu.' % sheet_name)
    auto_detected = header_row is None
    h = detect_header_row(raw_df) if auto_detected else int(header_row)
    h = max(0, min(h, raw_df.shape[0] - 1))
    progress('Đang tách dòng dữ liệu...', 55)
    is_csv = st['kind'] == 'csv'
    data_df, columns, col_types = slice_data_and_type(raw_df, h, is_csv)
    st.update({'sheetName': sheet_name, 'headerRow': h, 'columns': columns, 'colTypes': col_types,
               'data_df': data_df, 'autoDetected': auto_detected})
    LAST_MERGE['value'] = None
    progress('Đang tạo bản xem trước...', 90)
    return build_sheet_info(slot)


def job_load_sample(progress):
    progress('Đang tạo dữ liệu mẫu...', 15)
    ord_df, cust_df = make_sample_dataframes()
    STATE['A'] = {'fileName': 'Đơn hàng_mẫu.xlsx', 'kind': 'excel',
                  'sheets_raw': {'Sheet1': ord_df}, 'sheetName': None, 'headerRow': None,
                  'columns': None, 'colTypes': None, 'data_df': None}
    STATE['B'] = {'fileName': 'Danh mục khách hàng_mẫu.xlsx', 'kind': 'excel',
                  'sheets_raw': {'Sheet1': cust_df}, 'sheetName': None, 'headerRow': None,
                  'columns': None, 'colTypes': None, 'data_df': None}
    progress('Đang xử lý dữ liệu mẫu...', 60)
    infoA = job_load_sheet(lambda *a, **k: None, 'A', 'Sheet1', None)
    infoB = job_load_sheet(lambda *a, **k: None, 'B', 'Sheet1', None)
    LAST_MERGE['value'] = None
    return {'A': infoA, 'B': infoB}


def require_slot(slot):
    st = STATE.get(slot)
    if not st or st.get('data_df') is None:
        raise FriendlyError('Chưa tải dữ liệu cho File %s.' % slot)
    return st


def job_suggest_keys(progress):
    a = require_slot('A'); b = require_slot('B')
    progress('Đang phân tích các cột...', 15)
    A, B = a['data_df'], b['data_df']
    opts = {'trimSpaces': True, 'caseInsensitive': True, 'normalizeUnicode': True, 'numericEquivalence': False}
    sample_size = 5000

    def col_set(df, c):
        s = clean_series(df[c].head(sample_size), opts)
        s = s[s != '']
        return set(s.tolist())

    a_sets = {c: col_set(A, c) for c in a['columns']}
    progress('Đang phân tích các cột...', 45)
    b_sets = {c: col_set(B, c) for c in b['columns']}
    progress('Đang so khớp các cặp cột...', 65)

    def name_sim(x, y):
        def norm(s):
            s = unicodedata.normalize('NFD', s)
            s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
            s = s.replace('đ', 'd').replace('Đ', 'D').lower()
            return re.sub(r'[^a-z0-9]', '', s)
        nx, ny = norm(x), norm(y)
        if not nx or not ny:
            return 0.0
        if nx == ny:
            return 0.18
        if len(nx) >= 3 and len(ny) >= 3 and (nx in ny or ny in nx):
            return 0.09
        return 0.0

    results = []
    for ca, sa in a_sets.items():
        if not sa:
            continue
        for cb, sb in b_sets.items():
            if not sb:
                continue
            inter = len(sa & sb)
            overlap = inter / min(len(sa), len(sb))
            bonus = name_sim(ca, cb)
            score = min(1.0, overlap * 0.85 + bonus)
            if overlap > 0.05 or bonus > 0:
                results.append({'colA': ca, 'colB': cb, 'matchRatio': round(overlap, 3),
                                 'score': score, 'nameSimilar': bonus > 0})
    results.sort(key=lambda r: -r['score'])
    progress('Xong', 100)
    return results[:8]


def job_check_keys(progress, config):
    a = require_slot('A'); b = require_slot('B')
    key_pairs = config.get('keyPairs') or []
    if not key_pairs:
        raise FriendlyError('Chưa chọn cột khóa.')
    opts = config['clean']
    A, B = a['data_df'], b['data_df']
    progress('Đang kiểm tra File A...', 20)
    keyA, emptyA = build_composite_key(A, [p['a'] for p in key_pairs], opts, 'A')
    progress('Đang kiểm tra File B...', 55)
    keyB, emptyB = build_composite_key(B, [p['b'] for p in key_pairs], opts, 'B')
    progress('Đang tính tỉ lệ khớp...', 80)

    def analyze(key, empty_mask, A_df, cols):
        real = key[~empty_mask]
        vc = real.value_counts()
        dup = vc[vc > 1]
        dup_count = int(dup.sum())
        examples = []
        if len(dup) > 0:
            for k in dup.index[:5]:
                row_idx = key[key == k].index[0]
                raw_vals = [A_df.at[row_idx, c] for c in cols]
                val_txt = ' + '.join('(trống)' if is_na_scalar(v) else str(v) for v in raw_vals)
                examples.append({'value': val_txt, 'count': int(dup.loc[k])})
        return {
            'emptyCount': int(empty_mask.sum()), 'duplicateCount': dup_count,
            'duplicateExamples': examples, 'distinctKeys': int(vc.size), 'totalRows': int(len(A_df)),
        }

    ra = analyze(keyA, emptyA, A, [p['a'] for p in key_pairs])
    rb = analyze(keyB, emptyB, B, [p['b'] for p in key_pairs])

    setA = set(keyA[~emptyA].tolist())
    setB = set(keyB[~emptyB].tolist())
    matched_a = len(setA & setB)
    rate_a_to_b = matched_a / len(setA) if setA else 0.0
    rate_b_to_a = matched_a / len(setB) if setB else 0.0
    progress('Xong', 100)
    return {
        'A': ra, 'B': rb, 'matchRateAtoB': rate_a_to_b, 'matchRateBtoA': rate_b_to_a,
        'warning': max(rate_a_to_b, rate_b_to_a) < 0.10,
    }


def job_run_merge(progress, config):
    a = require_slot('A'); b = require_slot('B')
    if not config.get('keyPairs'):
        raise FriendlyError('Chưa chọn cột khóa.')
    if not config.get('joinType'):
        raise FriendlyError('Chưa chọn kiểu ghép.')
    t0 = time.time()
    result_df, stats, plan = run_merge_core(a['data_df'], b['data_df'], config, progress)
    stats['elapsedMs'] = (time.time() - t0) * 1000.0

    join_type = int(config['joinType'])
    out_columns = plan['key_out_names'] + list(plan['a_out_names'].values()) + list(plan['b_out_names'].values())
    types_by_col = {}
    for c in plan['key_out_names']:
        types_by_col[c] = 'text'
    for src, out in plan['a_out_names'].items():
        idx = a['columns'].index(src)
        types_by_col[out] = a['colTypes'][idx]
    for src, out in plan['b_out_names'].items():
        idx = b['columns'].index(src)
        types_by_col[out] = b['colTypes'][idx]
    out_col_types = [types_by_col.get(c, 'text') for c in out_columns]

    LAST_MERGE['value'] = {
        'result_df': result_df, 'out_columns': out_columns, 'out_col_types': out_col_types,
        'config': config, 'stats': stats, 'plan': plan, 'join_type': join_type,
        'file_info_a': build_sheet_info('A'), 'file_info_b': build_sheet_info('B'),
    }

    include_status = join_type == 7
    progress('Đang tạo bản xem trước...', 95)
    preview_cols = (['Trạng thái', 'Chi tiết lệch'] + out_columns) if include_status else out_columns[:]
    head = result_df.head(100)
    preview = []
    for _, row in head.iterrows():
        rec = {}
        for c in preview_cols:
            rec[c] = to_jsonable(row[c]) if c in row.index else ''
        preview.append(rec)
    return {'stats': stats, 'columns': preview_cols, 'preview': preview, 'statusIncluded': include_status}


def job_export(progress, config):
    lm = LAST_MERGE['value']
    if not lm:
        raise FriendlyError('Chưa có kết quả để xuất. Vui lòng chạy ghép dữ liệu trước.')
    file_bytes = export_to_excel_bytes(
        lm['result_df'], lm['out_columns'], lm['out_col_types'], lm['config'], lm['stats'],
        lm['plan'], lm['join_type'], lm['file_info_a'], lm['file_info_b'], progress)
    file_name = 'KetQua_Ghep_%s.xlsx' % datetime.now().strftime('%Y%m%d_%H%M%S')
    token = secrets.token_hex(16)
    EXPORT_FILES[token] = {'bytes': file_bytes, 'filename': file_name, 'ts': time.time()}
    # dọn các file xuất cũ (giữ 20 file gần nhất)
    if len(EXPORT_FILES) > 20:
        oldest = sorted(EXPORT_FILES.items(), key=lambda kv: kv[1]['ts'])[:-20]
        for k, _ in oldest:
            EXPORT_FILES.pop(k, None)
    return {'fileName': file_name, 'downloadUrl': '/api/download/%s' % token}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def api_upload():
    slot = request.form.get('slot')
    if slot not in ('A', 'B'):
        return jsonify({'message': 'Vị trí file không hợp lệ.'}), 400
    f = request.files.get('file')
    if not f:
        return jsonify({'message': 'Không nhận được file.'}), 400
    filename = f.filename or 'file'
    try:
        file_bytes = f.read()
    except Exception as e:
        return jsonify({'message': friendly_message(e)}), 400
    if not file_bytes:
        return jsonify({'message': 'File rỗng hoặc không đọc được nội dung.'}), 400
    job_id = start_job(job_load_file, slot, filename, file_bytes)
    return jsonify({'job_id': job_id})


def start_json_job(target):
    payload = request.get_json(silent=True) or {}
    job_id = start_job(target, payload)
    return jsonify({'job_id': job_id})


@app.route('/api/load_sheet', methods=['POST'])
def api_load_sheet():
    payload = request.get_json(silent=True) or {}
    job_id = start_job(job_load_sheet, payload.get('slot'), payload.get('sheetName'), payload.get('headerRow'))
    return jsonify({'job_id': job_id})


@app.route('/api/load_sample', methods=['POST'])
def api_load_sample():
    job_id = start_job(job_load_sample)
    return jsonify({'job_id': job_id})


@app.route('/api/suggest_keys', methods=['POST'])
def api_suggest_keys():
    job_id = start_job(job_suggest_keys)
    return jsonify({'job_id': job_id})


@app.route('/api/check_keys', methods=['POST'])
def api_check_keys():
    return start_json_job(job_check_keys)


@app.route('/api/run_merge', methods=['POST'])
def api_run_merge():
    return start_json_job(job_run_merge)


@app.route('/api/export', methods=['POST'])
def api_export():
    return start_json_job(job_export)


@app.route('/api/swap', methods=['POST'])
def api_swap():
    try:
        STATE['A'], STATE['B'] = STATE['B'], STATE['A']
        LAST_MERGE['value'] = None
        result = {
            'A': build_sheet_info('A') if STATE['A'] and STATE['A'].get('data_df') is not None else None,
            'B': build_sheet_info('B') if STATE['B'] and STATE['B'].get('data_df') is not None else None,
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({'message': friendly_message(e)}), 400


@app.route('/api/download/<token>', methods=['GET'])
def api_download(token):
    item = EXPORT_FILES.get(token)
    if not item:
        abort(404)
    return send_file(
        io.BytesIO(item['bytes']), as_attachment=True, download_name=item['filename'],
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


@app.errorhandler(413)
def too_large(e):
    return jsonify({'message': 'File vượt quá dung lượng cho phép (%d MB).' % MAX_UPLOAD_MB}), 413


@app.errorhandler(500)
def server_error(e):
    return jsonify({'message': 'Máy chủ gặp lỗi không mong muốn. Vui lòng thử lại.'}), 500


# ---------------------------------------------------------------------------
# Khởi động: tự tìm cổng trống, tự mở trình duyệt
# ---------------------------------------------------------------------------
def find_free_port(preferred=5000):
    for port in [preferred] + list(range(5001, 5050)):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def main():
    port = find_free_port(5000)
    url = 'http://127.0.0.1:%d' % port
    print('=' * 60)
    print(' TOOL GHÉP & ĐỐI CHIẾU EXCEL')
    print('=' * 60)
    print(' Đang khởi động máy chủ xử lý dữ liệu (chỉ chạy trên máy này,')
    print(' dữ liệu không gửi ra ngoài Internet)...')
    print('')
    print(' Địa chỉ truy cập : %s' % url)
    print(' Trình duyệt sẽ tự mở sau vài giây. Nếu không tự mở, hãy copy')
    print(' địa chỉ trên và dán vào Chrome/Edge/Firefox.')
    print('')
    print(' Để TẮT tool: quay lại cửa sổ này và bấm Ctrl + C, hoặc đóng')
    print(' hẳn cửa sổ này lại.')
    print('=' * 60)

    def open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()
    try:
        app.run(host='127.0.0.1', port=port, debug=False, threaded=True)
    except Exception as e:
        print('Không khởi động được máy chủ:', e)
        input('Bấm Enter để đóng cửa sổ...')


if __name__ == '__main__':
    main()
