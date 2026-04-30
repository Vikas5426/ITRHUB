import csv
from datetime import datetime
from io import StringIO
from dateutil import parser

def parse_and_calc(content: str, slab_rate: float = 0.30):
    f = StringIO(content)
    r = csv.DictReader(f)
    res = []
    trades = list(r)
    
    for t in trades:
        name = t.get('Asset Name', 'Unknown')
        typ = t.get('Asset Type', 'Listed Equity')
        
        try:
            bd = parser.parse(t['Buy Date'].strip())
            sd = parser.parse(t['Sell Date'].strip())
        except:
            continue
            
        days = (sd - bd).days
        bp = float(t.get('Buy Price', 0))
        sp = float(t.get('Sell Price', 0))
        qty = float(t.get('Quantity', 0))
        
        gain = (sp - bp) * qty
        if gain < 0:
            res.append({
                "id": len(res),
                "name": name,
                "type": typ,
                "days": days,
                "gain": gain,
                "tax": 0,
                "bd": bd.strftime('%Y-%m-%d'),
                "sd": sd.strftime('%Y-%m-%d'),
                "cat": "Loss"
            })
            continue

        tax = 0
        cat = ""
        comp = None

        if typ == 'Debt Mutual Fund':
            cut = datetime(2023, 4, 1)
            if bd >= cut:
                tax = gain * slab_rate
                cat = "Slab"
            else:
                if days > 1095:
                    tax = gain * 0.20
                    cat = "LTCG"
                else:
                    tax = gain * slab_rate
                    cat = "STCG"
        elif typ in ['Real Estate', 'Gold', 'Unlisted Shares']:
            is_ltcg = days > 730
            if is_ltcg:
                cat = "LTCG"
                if typ == 'Real Estate' and bd < datetime(2024, 7, 23):
                    t1 = gain * 0.125
                    t2 = (gain * 0.7) * 0.20
                    tax = min(t1, t2)
                    comp = {"opt1": t1, "opt2": t2, "chosen": tax}
                else:
                    tax = gain * 0.125
            else:
                cat = "STCG"
                tax = gain * slab_rate
        else:
            is_ltcg = days > 365
            if is_ltcg:
                cat = "LTCG"
                tax = gain * 0.125
            else:
                cat = "STCG"
                tax = gain * 0.20

        tax = tax * 1.04

        res.append({
            "id": len(res),
            "name": name,
            "type": typ,
            "days": days,
            "gain": gain,
            "tax": tax,
            "bd": bd.strftime('%Y-%m-%d'),
            "sd": sd.strftime('%Y-%m-%d'),
            "cat": cat,
            "comp": comp
        })

    rem_ex = 125000
    for x in res:
        if x['type'] in ['Listed Equity', 'Equity MFs'] and x['cat'] == 'LTCG' and x['gain'] > 0:
            if rem_ex > 0:
                if x['gain'] <= rem_ex:
                    rem_ex -= x['gain']
                    x['tax'] = 0
                else:
                    taxable = x['gain'] - rem_ex
                    rem_ex = 0
                    x['tax'] = (taxable * 0.125) * 1.04
                    
    return res
