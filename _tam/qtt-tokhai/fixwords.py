import re,sys
def fix(s):
    s=s.replace('cổng dịch vụ công thuế','trang dịch vụ công').replace('Cổng dịch vụ công thuế','Trang dịch vụ công')
    s=s.replace('cổng dịch vụ công','trang dịch vụ công').replace('Cổng dịch vụ công','Trang dịch vụ công')
    s=s.replace('Cổng thuế','Trang dịch vụ công').replace('cổng thuế','trang dịch vụ công').replace('trang thuế','trang dịch vụ công').replace('Trang thuế','Trang dịch vụ công')
    s=re.sub(r'Cổng(?= )','Trang dịch vụ công',s); s=re.sub(r'(?<![\wÀ-ỹ])cổng(?=[ );:,.\'"])','trang dịch vụ công',s)
    s=s.replace('Tải tờ khai thuế hàng loạt','Tải tờ khai thuế đã nộp hàng loạt').replace('<b>Tải tờ khai hàng loạt</b>','<b>Tải tờ khai thuế đã nộp hàng loạt</b>')
    s=s.replace('trang dịch vụ công thật','trang dịch vụ công thật')
    return s
for p in sys.argv[1:]:
    t=open(p,encoding='utf-8').read(); n=fix(t); open(p,'w',encoding='utf-8').write(n); print(p, t.count('ổng')-n.count('ổng'))
