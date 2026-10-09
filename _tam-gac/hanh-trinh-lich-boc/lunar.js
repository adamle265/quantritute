  /* ---------- âm lịch Việt Nam (thuật toán Hồ Ngọc Đức, múi giờ +7) ---------- */
  const lunar = (() => {
    const F = Math.floor, PI = Math.PI, dr = PI / 180, TZ = 7;
    const jd = (d, m, y) => { const a = F((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
      return d + F((153 * mm + 2) / 5) + 365 * yy + F(yy / 4) - F(yy / 100) + F(yy / 400) - 32045; };
    const newMoon = k => {
      const T = k / 1236.85, T2 = T * T, T3 = T2 * T;
      let J = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
      const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3, Mp = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3,
        Fa = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3, s = x => Math.sin(x * dr);
      const C = (0.1734 - 0.000393 * T) * s(M) + 0.0021 * s(2 * M) - 0.4068 * s(Mp) + 0.0161 * s(2 * Mp) - 0.0004 * s(3 * Mp) + 0.0104 * s(2 * Fa)
        - 0.0051 * s(M + Mp) - 0.0074 * s(M - Mp) + 0.0004 * s(2 * Fa + M) - 0.0004 * s(2 * Fa - M) - 0.0006 * s(2 * Fa + Mp) + 0.0010 * s(2 * Fa - Mp) + 0.0005 * s(2 * Mp + M);
      const dt = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
      return J + C - dt;
    };
    const nmDay = k => F(newMoon(k) + 0.5 + TZ / 24);
    const sunLong = n => {
      const T = (n - 0.5 - TZ / 24 - 2451545.0) / 36525, T2 = T * T;
      const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2, L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
      const DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
      let L = (L0 + DL) * dr; L -= PI * 2 * F(L / (PI * 2));
      return F(L / PI * 6);
    };
    const m11 = y => { const k = F((jd(31, 12, y) - 2415021) / 29.530588853); let nm = nmDay(k); if (sunLong(nm) >= 9) nm = nmDay(k - 1); return nm; };
    const leapOff = a11 => { const k = F((a11 - 2415021.076998695) / 29.530588853 + 0.5); let last, i = 1, arc = sunLong(nmDay(k + i));
      do { last = arc; i++; arc = sunLong(nmDay(k + i)); } while (arc !== last && i < 14); return i - 1; };
    return (d, m, y) => {
      const n = jd(d, m, y), k = F((n - 2415021.076998695) / 29.530588853);
      let start = nmDay(k + 1); if (start > n) start = nmDay(k);
      let a11 = m11(y), b11 = a11, ly;
      if (a11 >= start) { ly = y; a11 = m11(y - 1); } else { ly = y + 1; b11 = m11(y + 1); }
      const ld = n - start + 1, diff = F((start - a11) / 29);
      let leap = 0, lm = diff + 11;
      if (b11 - a11 > 365) { const lo = leapOff(a11); if (diff >= lo) { lm = diff + 10; if (diff === lo) leap = 1; } }
      if (lm > 12) lm -= 12;
      if (lm >= 11 && diff < 4) ly -= 1;
      return [ld, lm, ly, leap];
    };
  })();
  const canChi = y => ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'][y % 10] + ' ' + ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'][y % 12];
