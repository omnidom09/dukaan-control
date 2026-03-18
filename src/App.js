/* eslint-disable */
import { useState, useEffect, useReducer, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════════════════════
const SEED_PRODUCTS = [
  { id:"p1", name:"Tata Salt",      nameHindi:"टाटा नमक",       price:20,  mrp:22,  gstRate:0,  stock:50,  category:"Grocery",       unit:"kg"   },
  { id:"p2", name:"Amul Butter",    nameHindi:"अमूल बटर",        price:55,  mrp:60,  gstRate:5,  stock:20,  category:"Dairy",         unit:"pkt"  },
  { id:"p3", name:"Parle-G",        nameHindi:"पार्ले-जी",       price:10,  mrp:10,  gstRate:18, stock:100, category:"Snacks",        unit:"pkt"  },
  { id:"p4", name:"Surf Excel",     nameHindi:"सर्फ एक्सेल",     price:45,  mrp:50,  gstRate:18, stock:8,   category:"Cleaning",      unit:"pkt"  },
  { id:"p5", name:"Colgate",        nameHindi:"कोलगेट",          price:75,  mrp:80,  gstRate:18, stock:25,  category:"Personal Care", unit:"tube" },
  { id:"p6", name:"Maggi",          nameHindi:"मैगी",            price:14,  mrp:15,  gstRate:18, stock:5,   category:"Snacks",        unit:"pkt"  },
  { id:"p7", name:"Aashirvaad Atta",nameHindi:"आशीर्वाद आटा",    price:270, mrp:295, gstRate:0,  stock:30,  category:"Grocery",       unit:"5kg"  },
  { id:"p8", name:"Dettol Soap",    nameHindi:"डेटॉल साबुन",     price:38,  mrp:40,  gstRate:18, stock:40,  category:"Personal Care", unit:"pcs"  },
];
const SEED_CUSTOMERS = [
  { id:"c1", name:"Ravi Sharma",   phone:"9811234567", address:"House No 12, Sector 4", balance:-450,  createdAt:"2026-01-10T10:00:00.000Z" },
  { id:"c2", name:"Sunita Devi",   phone:"9822345678", address:"Gali No 3, Near Temple", balance:-120, createdAt:"2026-02-01T10:00:00.000Z" },
  { id:"c3", name:"Mohit Kumar",   phone:"9833456789", address:"Flat 5B, Green Colony",  balance:0,    createdAt:"2026-02-15T10:00:00.000Z" },
];
const SEED_KHATA = [
  { id:"k1", customerId:"c1", type:"credit", amount:450, note:"Groceries",       date:"2026-03-01T10:00:00.000Z" },
  { id:"k2", customerId:"c2", type:"credit", amount:300, note:"Dairy + Snacks",  date:"2026-03-05T11:00:00.000Z" },
  { id:"k3", customerId:"c2", type:"payment",amount:180, note:"Cash payment",    date:"2026-03-10T15:00:00.000Z" },
];
const DEFAULT_SETTINGS = {
  shopName:"Sharma General Store", shopNameHindi:"शर्मा जनरल स्टोर",
  shopAddress:"12, Market Road, Laxmi Nagar, Delhi - 110092",
  shopGST:"07AABCS1429B1Z1", shopPhone:"9876543210", ownerName:"Ramesh Sharma",
};

// ═══════════════════════════════════════════════════════════════
//  LOCAL DB
// ═══════════════════════════════════════════════════════════════
const db = {
  get:(k,d)=>{ try{ const v=localStorage.getItem("dcs_"+k); return v?JSON.parse(v):d; }catch{ return d; }},
  set:(k,v)=>{ try{ localStorage.setItem("dcs_"+k,JSON.stringify(v)); }catch{} },
};

// ═══════════════════════════════════════════════════════════════
//  CART REDUCER
// ═══════════════════════════════════════════════════════════════
function cartReducer(s,a){
  switch(a.type){
    case "ADD":{ const x=s.find(i=>i.id===a.p.id); return x?s.map(i=>i.id===a.p.id?{...i,qty:i.qty+1}:i):[...s,{...a.p,qty:1}]; }
    case "DEL": return s.filter(i=>i.id!==a.id);
    case "QTY": return s.map(i=>i.id===a.id?{...i,qty:Math.max(1,a.qty)}:i);
    case "CLR": return [];
    default: return s;
  }
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const uid     = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const todayStr= ()=>new Date().toISOString().split("T")[0];
const fmtDate = d=>new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"});
const fmtTime = d=>new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const calcTotals=cart=>{ let sub=0,gst=0; cart.forEach(i=>{ const l=i.price*i.qty; sub+=l; gst+=l*(i.gstRate/100); }); return {sub,gst,total:sub+gst}; };

function buildInvoice(txn,cfg){
  const no=`INV-${txn.id.slice(-6).toUpperCase()}`;
  const dt=new Date(txn.date).toLocaleString("en-IN");
  const rows=txn.items.map(i=>{ const b=i.price*i.qty,g=b*(i.gstRate/100); return `<tr><td>${i.name}</td><td class=c>${i.qty} ${i.unit}</td><td class=r>₹${i.price}</td><td class=c>${i.gstRate}%</td><td class=r>₹${(b+g).toFixed(2)}</td></tr>`; }).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${no}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:13px;padding:20px;color:#111;max-width:380px;margin:auto}.hd{text-align:center;border-bottom:2px solid #E8710A;padding-bottom:10px;margin-bottom:10px}.sn{font-size:20px;font-weight:700;color:#E8710A}.gstin{display:inline-block;background:#FFF3E0;border:1px solid #E8710A;padding:2px 8px;border-radius:4px;font-size:11px;margin-top:4px}.meta{display:flex;justify-content:space-between;font-size:11px;color:#555;margin:8px 0}table{width:100%;border-collapse:collapse}thead td{background:#E8710A;color:#fff;padding:6px 4px;font-weight:600}td{padding:5px 4px;border-bottom:1px solid #eee}.c{text-align:center}.r{text-align:right}.sub td,.gst-row td{font-weight:600}.gst-row td{color:#E8710A}.grand td{background:#FFF3E0;font-weight:700;font-size:15px;color:#E8710A}.ft{text-align:center;margin-top:14px;font-size:11px;color:#999;border-top:1px dashed #ccc;padding-top:8px}</style></head><body><div class=hd><div class=sn>${cfg.shopName}</div><div style="font-size:14px;color:#666">${cfg.shopNameHindi}</div><div style="font-size:11px;color:#666">${cfg.shopAddress}</div><div style="font-size:11px">📞 ${cfg.shopPhone}</div><div class=gstin>GSTIN: ${cfg.shopGST}</div></div><div class=meta><div><b>Invoice:</b> ${no}<br><b>Date:</b> ${dt}</div><div style="text-align:right"><b>Customer:</b> ${txn.customerName||"Walk-in"}<br><b>Payment:</b> ${txn.paymentMode}</div></div><table><thead><tr><td>Item</td><td class=c>Qty</td><td class=r>Rate</td><td class=c>GST</td><td class=r>Amt</td></tr></thead><tbody>${rows}<tr class=sub><td colspan=4>Subtotal (excl. GST)</td><td class=r>₹${txn.sub.toFixed(2)}</td></tr><tr class=gst-row><td colspan=4>CGST + SGST</td><td class=r>₹${txn.gst.toFixed(2)}</td></tr><tr class=grand><td colspan=4>GRAND TOTAL</td><td class=r>₹${txn.total.toFixed(2)}</td></tr></tbody></table><div class=ft><div>धन्यवाद! पुनः पधारें 🙏</div><div>Thank you for shopping with us!</div><div style="margin-top:4px;font-size:10px">*Computer generated invoice*</div></div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════
function STYLES(){
  return(
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      *{box-sizing:border-box} body{margin:0}
      ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#F97316;border-radius:2px}
      input,select,button,textarea{font-family:'Baloo 2',cursive}
      .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);color:white;padding:10px 22px;border-radius:12px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);animation:sld .2s ease;white-space:nowrap;font-size:14px}
      @keyframes sld{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
      @keyframes fup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
      @keyframes spin{to{transform:rotate(360deg)}}
      .pcard{transition:transform .12s,box-shadow .12s;cursor:pointer}
      .pcard:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(249,115,22,.2)!important}
      .pcard:active{transform:scale(.97)}
      .bp{background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;border:none;cursor:pointer;border-radius:12px;font-weight:700;transition:all .12s;display:flex;align-items:center;justify-content:center;gap:6px}
      .bp:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(249,115,22,.4)}
      .bp:active{transform:scale(.97)}
      .bg2{background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;border:none;cursor:pointer;border-radius:12px;font-weight:700;transition:all .12s;display:flex;align-items:center;justify-content:center;gap:6px}
      .bg2:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(34,197,94,.4)}
      .br2{background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;border:none;cursor:pointer;border-radius:12px;font-weight:700;transition:all .12s;display:flex;align-items:center;justify-content:center;gap:6px}
      .br2:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(239,68,68,.4)}
      .bb2{background:linear-gradient(135deg,#3B82F6,#2563EB);color:#fff;border:none;cursor:pointer;border-radius:12px;font-weight:700;transition:all .12s;display:flex;align-items:center;justify-content:center;gap:6px}
      .bb2:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(59,130,246,.4)}
      .overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;backdrop-filter:blur(3px)}
      .modal{background:#fff;border-radius:22px;max-height:92vh;overflow-y:auto;width:100%;max-width:480px;animation:fup .22s ease;box-shadow:0 24px 60px rgba(0,0,0,.35)}
      .inp{width:100%;padding:10px 13px;border-radius:11px;border:2px solid #E7E5E4;font-size:14px;outline:none;background:#FAFAFA;transition:border-color .15s}
      .inp:focus{border-color:#F97316;background:#fff}
      .navb{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 10px 8px;cursor:pointer;border-radius:12px;transition:all .15s;font-size:10px;font-weight:700;border:none;background:transparent;position:relative;flex:1}
      .navb.on{color:#F97316}.navb:not(.on){color:#78716C}
      .pill{padding:5px 12px;border-radius:20px;border:none;font-weight:700;font-size:12px;cursor:pointer;transition:all .12s;white-space:nowrap}
      .srch{width:100%;padding:13px 13px 13px 44px;border-radius:14px;border:2px solid #E7E5E4;font-size:15px;background:#fff;outline:none;box-shadow:0 2px 8px rgba(0,0,0,.05);transition:border-color .15s}
      .srch:focus{border-color:#F97316}
      .card{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
      .mono{font-family:'JetBrains Mono',monospace}
      .cred-badge{background:#FEE2E2;color:#DC2626;padding:3px 9px;border-radius:8px;font-weight:800;font-size:13px}
      .paid-badge{background:#DCFCE7;color:#16A34A;padding:3px 9px;border-radius:8px;font-weight:800;font-size:13px}
      .entry-credit{border-left:3px solid #EF4444;background:#FFF5F5}
      .entry-payment{border-left:3px solid #22C55E;background:#F0FDF4}
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════
export default function App(){
  const [loggedIn,  setLoggedIn] = useState(()=>db.get("auth",false));
  const [screen,    setScreen]   = useState("pos");
  const [products,  setProducts] = useState(()=>db.get("products",SEED_PRODUCTS));
  const [txns,      setTxns]     = useState(()=>db.get("transactions",[]));
  const [customers, setCustomers]= useState(()=>db.get("customers",SEED_CUSTOMERS));
  const [khata,     setKhata]    = useState(()=>db.get("khata",SEED_KHATA));
  const [settings,  setSettings] = useState(()=>db.get("settings",DEFAULT_SETTINGS));
  const [cart,      cartDispatch]= useReducer(cartReducer,[]);
  const [toast,     setToast]    = useState(null);
  const [invoice,   setInvoice]  = useState(null);
  const [payMode,   setPayMode]  = useState("Cash");
  const [custName,  setCustName] = useState("");
  const [showCO,    setShowCO]   = useState(false);

  useEffect(()=>db.set("products",products),  [products]);
  useEffect(()=>db.set("transactions",txns),  [txns]);
  useEffect(()=>db.set("customers",customers),[customers]);
  useEffect(()=>db.set("khata",khata),        [khata]);
  useEffect(()=>db.set("settings",settings),  [settings]);

  const notify=useCallback((msg,type="ok")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2800); },[]);
  const {sub,gst,total}=useMemo(()=>calcTotals(cart),[cart]);

  const finalizeSale=(khataCustomerId=null)=>{
    if(!cart.length)return;
    const txn={id:uid(),date:new Date().toISOString(),items:cart.map(i=>({...i})),sub,gst,total,customerName:custName,paymentMode:payMode,khataCustomerId};
    setProducts(p=>p.map(pr=>{ const ci=cart.find(c=>c.id===pr.id); return ci?{...pr,stock:Math.max(0,pr.stock-ci.qty)}:pr; }));
    setTxns(p=>[txn,...p]);
    if(khataCustomerId){
      const entry={id:uid(),customerId:khataCustomerId,type:"credit",amount:total,note:`Bill ${txn.id.slice(-4).toUpperCase()} (${cart.map(i=>i.name).join(", ")})`,date:new Date().toISOString()};
      setKhata(k=>[entry,...k]);
      setCustomers(cs=>cs.map(c=>c.id===khataCustomerId?{...c,balance:c.balance-total}:c));
    }
    cartDispatch({type:"CLR"}); setCustName(""); setShowCO(false); setInvoice(txn);
    notify(`✅ Sale ₹${total.toFixed(0)} complete!`);
  };

  const lowStock= useMemo(()=>products.filter(p=>p.stock>0&&p.stock<=10),[products]);
  const outStock= useMemo(()=>products.filter(p=>p.stock===0),[products]);
  const totalUdhar=useMemo(()=>customers.reduce((s,c)=>s+(c.balance<0?Math.abs(c.balance):0),0),[customers]);

  if(!loggedIn) return <Login onLogin={()=>{ setLoggedIn(true); db.set("auth",true); }}/>;

  return(
    <div style={{fontFamily:"'Baloo 2',cursive",background:"#FFF9F2",minHeight:"100vh"}}>
      <STYLES/>
      {toast&&<div className="toast" style={{background:toast.type==="ok"?"#16A34A":toast.type==="wa"?"#25D366":"#DC2626"}}>{toast.msg}</div>}
      <Header lowStock={lowStock} outStock={outStock} totalUdhar={totalUdhar} onLogout={()=>{ setLoggedIn(false); db.set("auth",false); }}/>
      <div style={{padding:"12px 12px 90px",maxWidth:780,margin:"0 auto"}}>
        {screen==="pos"       && <POSView        products={products} cart={cart} cartDispatch={cartDispatch} sub={sub} gst={gst} total={total} showCO={showCO} setShowCO={setShowCO} custName={custName} setCustName={setCustName} payMode={payMode} setPayMode={setPayMode} finalizeSale={finalizeSale} customers={customers}/>}
        {screen==="khata"     && <KhataView      customers={customers} setCustomers={setCustomers} khata={khata} setKhata={setKhata} notify={notify} settings={settings}/>}
        {screen==="inventory" && <InventoryView  products={products} setProducts={setProducts} notify={notify} lowStock={lowStock} outStock={outStock}/>}
        {screen==="reports"   && <ReportsView    transactions={txns} customers={customers} khata={khata}/>}
        {screen==="settings"  && <SettingsView   settings={settings} setSettings={setSettings} notify={notify}/>}
      </div>
      {invoice && <InvoiceModal txn={invoice} cfg={settings} onClose={()=>setInvoice(null)}/>}
      <BottomNav screen={screen} setScreen={setScreen} cartCount={cart.reduce((s,i)=>s+i.qty,0)} udharCount={customers.filter(c=>c.balance<0).length}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
function Login({onLogin}){
  const [pin,setPin]=useState(""); const [shake,setShake]=useState(false);
  const press=d=>{ if(pin.length>=4)return; const np=pin+d; setPin(np); if(np.length===4){ if(np==="1234"){setTimeout(onLogin,220);}else{setShake(true);setTimeout(()=>{setPin("");setShake(false);},700);} }};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#0F172A 0%,#1E3A5F 50%,#0F172A 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Baloo 2',cursive"}}>
      <STYLES/>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontSize:64,filter:"drop-shadow(0 4px 16px rgba(249,115,22,.4))"}}>🏪</div>
        <div style={{fontSize:30,fontWeight:800,color:"#F97316",letterSpacing:-0.5,marginTop:8}}>Dukaan Control</div>
        <div style={{fontSize:15,color:"#94A3B8",marginTop:3}}>दुकान कंट्रोल सिस्टम v2</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
          {["🧾 Billing","📒 Khata","📦 Stock","📊 Reports"].map(t=><span key={t} style={{background:"rgba(249,115,22,.15)",color:"#F97316",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>{t}</span>)}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:24,padding:28,width:"100%",maxWidth:340,boxShadow:"0 30px 60px rgba(0,0,0,.45)"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:"#64748B"}}>PIN दर्ज करें / Enter PIN</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:14}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:54,height:54,borderRadius:14,border:`2.5px solid ${pin.length>i?(shake?"#EF4444":"#F97316"):"#E2E8F0"}`,background:pin.length>i?(shake?"#FEE2E2":"#FFF3E0"):"#F8FAFC",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,transition:"all .15s",fontWeight:800,color:shake?"#EF4444":"#F97316"}}>
                {pin.length>i?"●":""}
              </div>
            ))}
          </div>
          {shake&&<div style={{color:"#EF4444",fontSize:13,fontWeight:700,marginTop:8}}>गलत PIN! Wrong PIN!</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d,i)=>(
            <button key={i} onClick={()=>d==="⌫"?setPin(p=>p.slice(0,-1)):d&&press(d)}
              style={{height:58,borderRadius:14,border:"none",fontSize:22,fontWeight:700,background:d==="⌫"?"#FEE2E2":d===""?"transparent":"#F8FAFC",color:d==="⌫"?"#EF4444":"#1C1917",cursor:d?"pointer":"default",boxShadow:d&&d!=="⌫"?"0 2px 6px rgba(0,0,0,.08)":"none"}}>
              {d}
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#94A3B8"}}>Demo PIN: <strong style={{color:"#F97316"}}>1234</strong></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HEADER
// ═══════════════════════════════════════════════════════════════
function Header({lowStock,outStock,totalUdhar,onLogout}){
  const ac=lowStock.length+outStock.length;
  return(
    <div style={{background:"#fff",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 14px rgba(0,0,0,.08)",position:"sticky",top:0,zIndex:200,gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <div style={{background:"linear-gradient(135deg,#F97316,#EA580C)",width:38,height:38,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:"0 3px 10px rgba(249,115,22,.3)"}}>🏪</div>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:800,fontSize:15,color:"#1C1917",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Dukaan Control <span style={{fontSize:11,color:"#F97316",fontWeight:700}}>v2</span></div>
          <div style={{fontSize:10,color:"#78716C"}}>Offline Ready ✓</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
        {totalUdhar>0&&<div style={{background:"#FEE2E2",color:"#DC2626",padding:"4px 8px",borderRadius:8,fontSize:11,fontWeight:700,animation:"pulse 2s infinite",whiteSpace:"nowrap"}}>📒 ₹{Math.round(totalUdhar)}</div>}
        {ac>0&&<div style={{background:"#FEF3C7",color:"#D97706",padding:"4px 8px",borderRadius:8,fontSize:11,fontWeight:700,animation:"pulse 2s infinite"}}>⚠️ {ac}</div>}
        <button onClick={onLogout} style={{background:"#FEE2E2",color:"#DC2626",border:"none",padding:"6px 11px",borderRadius:9,fontSize:12,cursor:"pointer",fontWeight:700}}>Exit</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════════════════════
function BottomNav({screen,setScreen,cartCount,udharCount}){
  const tabs=[{id:"pos",icon:"🧾",en:"Billing",hi:"बिलिंग"},{id:"khata",icon:"📒",en:"Khata",hi:"खाता"},{id:"inventory",icon:"📦",en:"Stock",hi:"स्टॉक"},{id:"reports",icon:"📊",en:"Reports",hi:"रिपोर्ट"},{id:"settings",icon:"⚙️",en:"Settings",hi:"सेटिंग"}];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",boxShadow:"0 -4px 20px rgba(0,0,0,.1)",display:"flex",justifyContent:"space-around",padding:"4px 0 8px",zIndex:200}}>
      {tabs.map(t=>(
        <button key={t.id} className={`navb ${screen===t.id?"on":""}`} onClick={()=>setScreen(t.id)}>
          {screen===t.id&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",width:28,height:3,background:"#F97316",borderRadius:"0 0 3px 3px"}}/>}
          <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
          {t.id==="pos"&&cartCount>0&&<div style={{position:"absolute",top:2,right:"18%",background:"#F97316",color:"#fff",width:16,height:16,borderRadius:"50%",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</div>}
          {t.id==="khata"&&udharCount>0&&<div style={{position:"absolute",top:2,right:"18%",background:"#EF4444",color:"#fff",width:16,height:16,borderRadius:"50%",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{udharCount}</div>}
          <span style={{fontSize:10}}>{t.en}</span>
          <span style={{fontSize:9,opacity:.6}}>{t.hi}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  POS VIEW
// ═══════════════════════════════════════════════════════════════
function POSView({products,cart,cartDispatch,sub,gst,total,showCO,setShowCO,custName,setCustName,payMode,setPayMode,finalizeSale,customers}){
  const [q,setQ]=useState(""); const [cat,setCat]=useState("All");
  const cats=useMemo(()=>["All",...new Set(products.map(p=>p.category))],[products]);
  const visible=useMemo(()=>{ let r=products; if(q.trim()){const s=q.toLowerCase();r=r.filter(p=>p.name.toLowerCase().includes(s)||p.nameHindi.includes(s)||p.category.toLowerCase().includes(s));} if(cat!=="All")r=r.filter(p=>p.category===cat); return r; },[products,q,cat]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18,pointerEvents:"none"}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search product / Category..." className="srch"/>
        {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#78716C"}}>✕</button>}
      </div>
      <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:3}}>
        {cats.map(c=><button key={c} className="pill" onClick={()=>setCat(c)} style={{background:cat===c?"#F97316":"#fff",color:cat===c?"#fff":"#78716C",boxShadow:"0 2px 6px rgba(0,0,0,.08)"}}>{c}</button>)}
      </div>
      {visible.length>0?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:10}}>
          {visible.map(p=>{ const ci=cart.find(c=>c.id===p.id); return(
            <div key={p.id} className="pcard card" onClick={()=>{ if(p.stock>0)cartDispatch({type:"ADD",p}); }}
              style={{padding:"12px 10px",border:`2px solid ${ci?"#F97316":"transparent"}`,opacity:p.stock===0?.55:1,cursor:p.stock>0?"pointer":"not-allowed",position:"relative"}}>
              {ci&&<div style={{position:"absolute",top:-9,right:-9,background:"#F97316",color:"#fff",width:24,height:24,borderRadius:"50%",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 6px rgba(249,115,22,.5)"}}>{ci.qty}</div>}
              {p.stock>0&&p.stock<=10&&<div style={{position:"absolute",top:5,left:5,background:"#FEF3C7",color:"#D97706",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>LOW</div>}
              {p.stock===0&&<div style={{position:"absolute",top:5,left:5,background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4}}>OUT</div>}
              <div style={{fontSize:13,fontWeight:700,color:"#1C1917",lineHeight:1.3,marginBottom:2}}>{p.name}</div>
              <div style={{fontSize:11,color:"#78716C",marginBottom:8}}>{p.nameHindi}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div><div className="mono" style={{fontSize:16,fontWeight:700,color:"#F97316"}}>₹{p.price}</div>{p.gstRate>0&&<div style={{fontSize:9,color:"#A8A29E"}}>+{p.gstRate}% GST</div>}</div>
                <div style={{fontSize:10,color:p.stock<=10?"#D97706":"#A8A29E",background:"#F5F5F4",padding:"2px 6px",borderRadius:5,fontWeight:600}}>{p.stock===0?"Out":p.stock}</div>
              </div>
            </div>
          ); })}
        </div>
      ):(
        <div style={{textAlign:"center",padding:48,color:"#A8A29E"}}><div style={{fontSize:44}}>🔍</div><div style={{fontWeight:700,marginTop:8}}>No products found — कोई प्रोडक्ट नहीं</div></div>
      )}
      {cart.length>0&&(
        <div className="card" style={{padding:16,border:"2px solid #FED7AA"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:16,color:"#1C1917"}}>🛒 Cart <span style={{color:"#78716C",fontSize:13}}>({cart.length} items)</span></div>
            <button onClick={()=>cartDispatch({type:"CLR"})} style={{background:"#FEE2E2",color:"#DC2626",border:"none",padding:"5px 10px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:700}}>🗑 Clear</button>
          </div>
          {cart.map(item=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #F5F5F4"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1C1917",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div style={{fontSize:11,color:"#78716C"}}>₹{item.price}{item.gstRate>0?` +${item.gstRate}%`:""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <button onClick={()=>{ if(item.qty===1)cartDispatch({type:"DEL",id:item.id}); else cartDispatch({type:"QTY",id:item.id,qty:item.qty-1}); }} style={{width:28,height:28,borderRadius:8,border:"none",background:"#F5F5F4",fontSize:16,cursor:"pointer",fontWeight:700,lineHeight:1}}>−</button>
                <span className="mono" style={{width:22,textAlign:"center",fontWeight:800,fontSize:13}}>{item.qty}</span>
                <button onClick={()=>cartDispatch({type:"QTY",id:item.id,qty:item.qty+1})} style={{width:28,height:28,borderRadius:8,border:"none",background:"#FFF3E0",fontSize:16,cursor:"pointer",fontWeight:700,color:"#F97316",lineHeight:1}}>+</button>
              </div>
              <div className="mono" style={{width:60,textAlign:"right",fontWeight:800,fontSize:13,color:"#1C1917"}}>₹{(item.price*item.qty*(1+item.gstRate/100)).toFixed(0)}</div>
            </div>
          ))}
          <div style={{marginTop:10,paddingTop:10,borderTop:"2px dashed #E7E5E4"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#78716C",marginBottom:4}}><span>Subtotal (excl. GST)</span><span className="mono">₹{sub.toFixed(2)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#D97706",marginBottom:8}}><span>GST</span><span className="mono">₹{gst.toFixed(2)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:21,fontWeight:800,color:"#F97316"}}><span>Total कुल</span><span className="mono">₹{total.toFixed(2)}</span></div>
          </div>
          <button className="bg2" onClick={()=>setShowCO(true)} style={{width:"100%",padding:14,fontSize:16,marginTop:13}}>✅ Checkout — Bill बनाएं</button>
        </div>
      )}
      {showCO&&<CheckoutModal sub={sub} gst={gst} total={total} custName={custName} setCustName={setCustName} payMode={payMode} setPayMode={setPayMode} finalizeSale={finalizeSale} customers={customers} onClose={()=>setShowCO(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CHECKOUT MODAL (enhanced with Khata option)
// ═══════════════════════════════════════════════════════════════
function CheckoutModal({sub,gst,total,custName,setCustName,payMode,setPayMode,finalizeSale,customers,onClose}){
  const [selCust,setSelCust]=useState(null);
  const [searchC,setSearchC]=useState("");
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(searchC.toLowerCase())||c.phone.includes(searchC));
  return(
    <div className="overlay">
      <div className="modal" style={{padding:24}}>
        <div style={{fontWeight:800,fontSize:18,marginBottom:16,color:"#1C1917"}}>💳 Checkout / भुगतान</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:6}}>Customer Name</div>
          <input value={custName} onChange={e=>setCustName(e.target.value)} placeholder="ग्राहक का नाम..." className="inp"/>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:8}}>Payment Mode</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7}}>
            {[["Cash","💵"],["UPI","📱"],["Card","💳"],["Udhar","📒"]].map(([m,ic])=>(
              <button key={m} onClick={()=>setPayMode(m)} style={{padding:"10px 6px",borderRadius:11,border:`2px solid ${payMode===m?(m==="Udhar"?"#EF4444":"#F97316"):"#E7E5E4"}`,background:payMode===m?(m==="Udhar"?"#FEF2F2":"#FFF3E0"):"#fff",color:payMode===m?(m==="Udhar"?"#DC2626":"#F97316"):"#78716C",fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .12s",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <span style={{fontSize:16}}>{ic}</span>{m}
              </button>
            ))}
          </div>
        </div>
        {payMode==="Udhar"&&(
          <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:14,padding:14,marginBottom:16}}>
            <div style={{fontWeight:700,color:"#DC2626",fontSize:13,marginBottom:10}}>📒 Add to Khata (Udhar) — किसके खाते में?</div>
            <input value={searchC} onChange={e=>setSearchC(e.target.value)} placeholder="Search customer..." className="inp" style={{marginBottom:10,borderColor:"#FECACA"}}/>
            <div style={{maxHeight:130,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {filtered.map(c=>(
                <div key={c.id} onClick={()=>setSelCust(c)} style={{padding:"8px 10px",borderRadius:10,border:`2px solid ${selCust?.id===c.id?"#EF4444":"#E7E5E4"}`,background:selCust?.id===c.id?"#FEE2E2":"#fff",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .12s"}}>
                  <div><div style={{fontWeight:700,fontSize:13,color:"#1C1917"}}>{c.name}</div><div style={{fontSize:11,color:"#78716C"}}>📞 {c.phone}</div></div>
                  {c.balance<0&&<span className="cred-badge">₹{Math.abs(c.balance).toFixed(0)} due</span>}
                </div>
              ))}
            </div>
            {selCust&&<div style={{marginTop:10,background:"#fff",borderRadius:10,padding:"8px 12px",border:"1.5px solid #FECACA",fontSize:13,color:"#DC2626",fontWeight:700}}>✓ Adding to: {selCust.name}'s Khata</div>}
          </div>
        )}
        <div style={{background:"#FFF3E0",borderRadius:14,padding:16,marginBottom:18,textAlign:"center"}}>
          <div style={{fontSize:13,color:"#78716C"}}>Total Amount</div>
          <div className="mono" style={{fontSize:34,fontWeight:800,color:payMode==="Udhar"?"#DC2626":"#F97316",lineHeight:1.1}}>₹{total.toFixed(2)}</div>
          {payMode==="Udhar"&&<div style={{fontSize:12,color:"#DC2626",marginTop:4,fontWeight:700}}>⚠️ Will be added to Khata as Udhar</div>}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:13,borderRadius:12,border:"2px solid #E7E5E4",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#78716C"}}>← Back</button>
          <button className={payMode==="Udhar"?"br2":"bg2"} onClick={()=>{ if(payMode==="Udhar"&&!selCust){alert("Please select a customer for Udhar!");return;} finalizeSale(payMode==="Udhar"?selCust?.id:null); }} style={{flex:2,padding:13,fontSize:15}}>
            {payMode==="Udhar"?"📒 Add to Khata":"🎉 Confirm Sale!"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ★ KHATA VIEW — THE STAR OF THIS UPDATE
// ═══════════════════════════════════════════════════════════════
function KhataView({customers,setCustomers,khata,setKhata,notify,settings}){
  const [view,setView]=useState("list");        // list | ledger
  const [selCust,setSelCust]=useState(null);
  const [q,setQ]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [showTxn,setShowTxn]=useState(null);   // "credit"|"payment"

  const totalUdhar=customers.reduce((s,c)=>s+(c.balance<0?Math.abs(c.balance):0),0);
  const totalAdv  =customers.reduce((s,c)=>s+(c.balance>0?c.balance:0),0);

  const filtered=useMemo(()=>{ let r=customers; if(q.trim())r=r.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||c.phone.includes(q)); return [...r].sort((a,b)=>a.balance-b.balance); },[customers,q]);

  const custLedger=useMemo(()=>selCust?[...khata].filter(k=>k.customerId===selCust.id).sort((a,b)=>new Date(b.date)-new Date(a.date)):[],[khata,selCust]);

  const openLedger=c=>{ setSelCust(c); setView("ledger"); };

  if(view==="ledger"&&selCust){
    return(
      <LedgerView
        customer={selCust} ledger={custLedger}
        onBack={()=>{ setView("list"); setSelCust(null); }}
        onAddTxn={(type)=>setShowTxn(type)}
        notify={notify} settings={settings}
        customers={customers} setCustomers={setCustomers}
        khata={khata} setKhata={setKhata}
        showTxn={showTxn} setShowTxn={setShowTxn}
      />
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Summary Banner */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:"linear-gradient(135deg,#FEF2F2,#FEE2E2)",borderRadius:14,padding:14,border:"1.5px solid #FECACA"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#DC2626",marginBottom:4}}>📒 Total Udhar</div>
          <div className="mono" style={{fontSize:24,fontWeight:800,color:"#DC2626",lineHeight:1}}>₹{totalUdhar.toFixed(0)}</div>
          <div style={{fontSize:11,color:"#EF4444",marginTop:3}}>{customers.filter(c=>c.balance<0).length} customers due</div>
        </div>
        <div style={{background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)",borderRadius:14,padding:14,border:"1.5px solid #BBF7D0"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#16A34A",marginBottom:4}}>✅ Advance Paid</div>
          <div className="mono" style={{fontSize:24,fontWeight:800,color:"#16A34A",lineHeight:1}}>₹{totalAdv.toFixed(0)}</div>
          <div style={{fontSize:11,color:"#22C55E",marginTop:3}}>{customers.filter(c=>c.balance>0).length} customers ahead</div>
        </div>
      </div>

      {/* Search + Add */}
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customer..." className="inp" style={{paddingLeft:38}}/>
        </div>
        <button className="bp" onClick={()=>setShowAdd(true)} style={{padding:"10px 14px",fontSize:14,flexShrink:0}}>+ ग्राहक</button>
      </div>

      {/* Customer List */}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {filtered.map(c=>{
          const due=c.balance<0; const settled=c.balance===0;
          return(
            <div key={c.id} className="card" onClick={()=>openLedger(c)}
              style={{padding:14,cursor:"pointer",border:`1.5px solid ${due?"#FECACA":settled?"#E7E5E4":"#BBF7D0"}`,transition:"all .12s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
                  <div style={{width:42,height:42,borderRadius:13,background:due?"#FEE2E2":settled?"#F5F5F4":"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {due?"😟":settled?"😊":"🤑"}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#1C1917",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                    <div style={{fontSize:11,color:"#78716C",marginTop:1}}>📞 {c.phone}</div>
                    <div style={{fontSize:10,color:"#A8A29E",marginTop:1}}>Since {fmtDate(c.createdAt)}</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {due&&<div className="cred-badge mono" style={{fontSize:14}}>₹{Math.abs(c.balance).toFixed(0)}</div>}
                  {settled&&<div className="paid-badge" style={{fontSize:12}}>✓ Clear</div>}
                  {c.balance>0&&<div style={{background:"#DCFCE7",color:"#16A34A",padding:"3px 9px",borderRadius:8,fontWeight:800,fontSize:13}} className="mono">+₹{c.balance.toFixed(0)}</div>}
                  <div style={{fontSize:10,color:"#A8A29E",marginTop:4}}>Tap for Khata →</div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"#A8A29E"}}><div style={{fontSize:40}}>📒</div><div style={{fontWeight:700,marginTop:8}}>No customers found</div></div>}
      </div>

      {showAdd&&<AddCustomerModal onSave={c=>{ setCustomers(p=>[...p,{...c,id:uid(),balance:0,createdAt:new Date().toISOString()}]); setShowAdd(false); notify("✅ Customer added!"); }} onClose={()=>setShowAdd(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LEDGER VIEW
// ═══════════════════════════════════════════════════════════════
function LedgerView({customer,ledger,onBack,onAddTxn,notify,settings,customers,setCustomers,khata,setKhata,showTxn,setShowTxn}){
  const due=customer.balance<0;

  const sendReminder=()=>{
    const msg=`🙏 नमस्ते ${customer.name} जी,\n\n*${settings.shopName}* से याद दिला रहे हैं।\n\nआपका बकाया: *₹${Math.abs(customer.balance).toFixed(2)}*\n\nकृपया जल्द भुगतान करें।\nधन्यवाद 🙏\n\n📞 ${settings.shopPhone}`;
    window.open(`https://wa.me/91${customer.phone}?text=${encodeURIComponent(msg)}`,"_blank");
    notify("📲 WhatsApp reminder sent!","wa");
  };

  const addEntry=(type,amount,note)=>{
    const entry={id:uid(),customerId:customer.id,type,amount:+amount,note,date:new Date().toISOString()};
    setKhata(k=>[entry,...k]);
    const delta=type==="credit"?-amount:+amount;
    setCustomers(cs=>cs.map(c=>c.id===customer.id?{...c,balance:c.balance+delta}:c));
    notify(type==="credit"?`📒 ₹${amount} Udhar added`:`✅ ₹${amount} Payment received!`);
    setShowTxn(null);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Back + header */}
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"#F5F5F4",border:"none",padding:"8px 14px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:700,color:"#78716C",flexShrink:0}}>← Back</button>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:800,fontSize:17,color:"#1C1917",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📒 {customer.name}</div>
          <div style={{fontSize:11,color:"#78716C"}}>📞 {customer.phone} · {customer.address}</div>
        </div>
      </div>

      {/* Balance Card */}
      <div style={{background:due?"linear-gradient(135deg,#DC2626,#B91C1C)":"linear-gradient(135deg,#16A34A,#15803D)",borderRadius:18,padding:20,color:"#fff",textAlign:"center",boxShadow:`0 8px 30px ${due?"rgba(220,38,38,.3)":"rgba(22,163,74,.3)"}`}}>
        <div style={{fontSize:13,opacity:.85,marginBottom:4}}>{due?"Total Udhar — कुल बकाया":"Balance — शेष"}</div>
        <div className="mono" style={{fontSize:42,fontWeight:800,lineHeight:1}}>₹{Math.abs(customer.balance).toFixed(2)}</div>
        <div style={{fontSize:12,opacity:.75,marginTop:6}}>{due?"Customer owes you this amount":"Customer has advance credit"}</div>
      </div>

      {/* Action Buttons */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
        <button className="br2" onClick={()=>setShowTxn("credit")} style={{padding:"11px 6px",fontSize:13}}>📒 Udhar</button>
        <button className="bg2" onClick={()=>setShowTxn("payment")} style={{padding:"11px 6px",fontSize:13}}>💰 Paisa</button>
        <button onClick={sendReminder} style={{padding:"11px 6px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>📲 Remind</button>
      </div>

      {/* Ledger Entries */}
      <div className="card" style={{padding:16}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1C1917",marginBottom:12}}>📋 Transaction History — लेनदेन</div>
        {ledger.length===0?(
          <div style={{textAlign:"center",padding:28,color:"#A8A29E"}}><div style={{fontSize:36}}>📋</div><div style={{fontWeight:700,marginTop:6}}>No transactions yet</div></div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ledger.map(e=>(
              <div key={e.id} className={e.type==="credit"?"entry-credit":"entry-payment"} style={{borderRadius:10,padding:"10px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:16}}>{e.type==="credit"?"📒":"💰"}</span>
                      <span style={{fontWeight:700,fontSize:13,color:e.type==="credit"?"#DC2626":"#16A34A"}}>{e.type==="credit"?"Udhar (Credit)":"Payment Received"}</span>
                    </div>
                    <div style={{fontSize:12,color:"#78716C",marginBottom:1}}>{e.note||"—"}</div>
                    <div style={{fontSize:11,color:"#A8A29E"}}>{fmtDate(e.date)} at {fmtTime(e.date)}</div>
                  </div>
                  <div className="mono" style={{fontWeight:800,fontSize:16,color:e.type==="credit"?"#DC2626":"#16A34A",marginLeft:8,flexShrink:0}}>
                    {e.type==="credit"?"-":"+"}₹{e.amount.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTxn&&<AddEntryModal type={showTxn} onSave={addEntry} onClose={()=>setShowTxn(null)} customerName={customer.name} balance={customer.balance}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADD ENTRY MODAL (Udhar / Payment)
// ═══════════════════════════════════════════════════════════════
function AddEntryModal({type,onSave,onClose,customerName,balance}){
  const [amt,setAmt]=useState(""); const [note,setNote]=useState("");
  const isCredit=type==="credit";
  const quickAmounts=[50,100,200,500,1000];
  return(
    <div className="overlay">
      <div className="modal" style={{padding:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:18,color:"#1C1917"}}>{isCredit?"📒 Add Udhar":"💰 Collect Payment"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#78716C"}}>✕</button>
        </div>
        <div style={{background:isCredit?"#FEF2F2":"#F0FDF4",borderRadius:13,padding:13,marginBottom:16,border:`1.5px solid ${isCredit?"#FECACA":"#BBF7D0"}`}}>
          <div style={{fontSize:13,color:isCredit?"#DC2626":"#16A34A",fontWeight:700}}>{customerName}</div>
          <div style={{fontSize:12,color:"#78716C",marginTop:2}}>Current balance: {balance<0?`₹${Math.abs(balance).toFixed(0)} due`:balance===0?"Clear":`₹${balance.toFixed(0)} advance`}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:6}}>Amount / राशि *</div>
          <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Enter ₹ amount..." className="inp" style={{fontSize:20,fontWeight:700}}/>
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {quickAmounts.map(a=>(
              <button key={a} onClick={()=>setAmt(String(a))} className="pill" style={{background:amt==String(a)?(isCredit?"#DC2626":"#16A34A"):"#F5F5F4",color:amt==String(a)?"#fff":"#64748B",fontSize:13}}>₹{a}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:6}}>Note (Optional)</div>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder={isCredit?"e.g. Groceries, Atta, Doodh...":"e.g. Cash payment, UPI..."} className="inp"/>
        </div>
        {amt&&(
          <div style={{background:isCredit?"#FEE2E2":"#DCFCE7",borderRadius:12,padding:12,marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:12,color:isCredit?"#DC2626":"#16A34A",fontWeight:700,marginBottom:2}}>New Balance after this entry:</div>
            <div className="mono" style={{fontSize:22,fontWeight:800,color:isCredit?"#DC2626":"#16A34A"}}>
              {(()=>{ const nb=isCredit?balance-+amt:balance+(+amt); return nb<0?`₹${Math.abs(nb).toFixed(0)} due`:nb===0?"✅ Clear":`₹${nb.toFixed(0)} advance`; })()}
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #E7E5E4",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#78716C"}}>Cancel</button>
          <button className={isCredit?"br2":"bg2"} onClick={()=>{ if(!amt||+amt<=0){alert("Enter valid amount!");return;} onSave(type,+amt,note||""); }} style={{flex:2,padding:12,fontSize:15}}>
            {isCredit?"📒 Add Udhar":"💰 Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADD CUSTOMER MODAL
// ═══════════════════════════════════════════════════════════════
function AddCustomerModal({onSave,onClose}){
  const [f,setF]=useState({name:"",phone:"",address:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div className="overlay">
      <div className="modal" style={{padding:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:18,color:"#1C1917"}}>👤 Add Customer — ग्राहक जोड़ें</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#78716C"}}>✕</button>
        </div>
        {[["name","Customer Name *","Ravi Sharma"],["phone","Phone Number *","9XXXXXXXXX"],["address","Address (Optional)","Gali No 3, Near..."]].map(([k,l,ph])=>(
          <div key={k} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:5}}>{l}</div>
            <input value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} className="inp" type={k==="phone"?"tel":"text"}/>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #E7E5E4",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#78716C"}}>Cancel</button>
          <button className="bp" onClick={()=>{ if(!f.name.trim()||!f.phone.trim()){alert("Name & Phone are required!");return;} onSave(f); }} style={{flex:2,padding:12,fontSize:15}}>✅ Add Customer</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  INVENTORY VIEW
// ═══════════════════════════════════════════════════════════════
function InventoryView({products,setProducts,notify,lowStock,outStock}){
  const [q,setQ]=useState(""); const [filterLow,setFilterLow]=useState(false); const [editing,setEditing]=useState(null);
  const list=useMemo(()=>{ let r=products; if(q.trim())r=r.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||p.category.toLowerCase().includes(q.toLowerCase())); if(filterLow)r=r.filter(p=>p.stock<=10); return r; },[products,q,filterLow]);
  const save=prod=>{ if(prod.id&&products.find(p=>p.id===prod.id)){setProducts(prev=>prev.map(p=>p.id===prod.id?prod:p));notify("✅ Updated!");}else{setProducts(prev=>[...prev,{...prod,id:uid()}]);notify("✅ Added!");} setEditing(null); };
  const del=id=>{ if(window.confirm("Delete?")){setProducts(prev=>prev.filter(p=>p.id!==id));notify("Deleted","err");} };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {(lowStock.length>0||outStock.length>0)&&(
        <div style={{background:"#FFFBEB",borderRadius:13,padding:13,border:"1.5px solid #FCD34D"}}>
          <div style={{fontWeight:800,color:"#D97706",marginBottom:6,fontSize:14}}>⚠️ Stock Alerts</div>
          {outStock.length>0&&<div style={{fontSize:12,color:"#DC2626",fontWeight:700}}>❌ Out: {outStock.map(p=>p.name).join(", ")}</div>}
          {lowStock.length>0&&<div style={{fontSize:12,color:"#D97706",marginTop:3}}>⚡ Low: {lowStock.map(p=>`${p.name}(${p.stock})`).join(", ")}</div>}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search..." className="inp" style={{flex:1}}/>
        <button onClick={()=>setFilterLow(!filterLow)} className="pill" style={{background:filterLow?"#F97316":"#fff",color:filterLow?"#fff":"#78716C",boxShadow:"0 2px 6px rgba(0,0,0,.08)"}}>⚠️ Low</button>
        <button className="bp" onClick={()=>setEditing({})} style={{padding:"10px 14px",fontSize:14}}>+ Add</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {list.map(p=>(
          <div key={p.id} className="card" style={{padding:14,border:`1.5px solid ${p.stock===0?"#FECACA":p.stock<=10?"#FDE68A":"transparent"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:3}}>
                  <span style={{fontWeight:800,fontSize:15,color:"#1C1917"}}>{p.name}</span>
                  <span style={{fontSize:12,color:"#78716C"}}>{p.nameHindi}</span>
                  {p.stock===0&&<span style={{background:"#FEE2E2",color:"#DC2626",fontSize:10,padding:"1px 7px",borderRadius:5,fontWeight:700}}>OUT</span>}
                  {p.stock>0&&p.stock<=10&&<span style={{background:"#FEF3C7",color:"#D97706",fontSize:10,padding:"1px 7px",borderRadius:5,fontWeight:700}}>LOW</span>}
                </div>
                <div style={{fontSize:11,color:"#78716C",marginBottom:6}}>{p.category} · {p.unit}</div>
                <div style={{display:"flex",gap:12,fontSize:13,flexWrap:"wrap"}}>
                  <span className="mono" style={{fontWeight:800,color:"#F97316"}}>₹{p.price}</span>
                  <span className="mono" style={{color:"#A8A29E",textDecoration:"line-through"}}>₹{p.mrp}</span>
                  <span style={{color:"#64748B"}}>GST {p.gstRate}%</span>
                  <span style={{color:p.stock<=10?"#D97706":"#22C55E",fontWeight:700}}>Stock: {p.stock}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>setEditing(p)} style={{background:"#EFF6FF",color:"#3B82F6",border:"none",padding:"6px 10px",borderRadius:9,fontSize:12,cursor:"pointer",fontWeight:700}}>Edit</button>
                <button onClick={()=>del(p.id)} style={{background:"#FEE2E2",color:"#DC2626",border:"none",padding:"6px 10px",borderRadius:9,fontSize:12,cursor:"pointer",fontWeight:700}}>Del</button>
              </div>
            </div>
          </div>
        ))}
        {list.length===0&&<div style={{textAlign:"center",padding:36,color:"#A8A29E"}}><div style={{fontSize:40}}>📦</div><div style={{fontWeight:700,marginTop:8}}>No products found</div></div>}
      </div>
      {editing!==null&&<ProductModal product={editing} onSave={save} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

function ProductModal({product,onSave,onClose}){
  const isNew=!product.id;
  const [f,setF]=useState({name:"",nameHindi:"",price:"",mrp:"",gstRate:0,stock:"",category:"Grocery",unit:"pkt",barcode:"",...product});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=()=>{ if(!f.name.trim()||!f.price||!f.stock){alert("Name, Price & Stock required!");return;} onSave({...f,price:+f.price,mrp:+(f.mrp||f.price),gstRate:+f.gstRate,stock:+f.stock}); };
  return(
    <div className="overlay"><div className="modal" style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:18,color:"#1C1917"}}>{isNew?"➕ Add Product":"✏️ Edit Product"}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#78716C"}}>✕</button>
      </div>
      {[["Product Name *","name","text","e.g. Tata Salt"],["Hindi Name","nameHindi","text","e.g. टाटा नमक"],["Barcode","barcode","text","8901234567890"]].map(([l,k,t,ph])=>(
        <div key={k} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>{l}</div><input type={t} value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} className="inp"/></div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[["Sell Price ₹ *","price","20"],["MRP ₹","mrp","22"]].map(([l,k,ph])=>(
          <div key={k}><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>{l}</div><input type="number" value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} className="inp"/></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>GST Rate</div>
          <select value={f.gstRate} onChange={e=>set("gstRate",e.target.value)} className="inp" style={{cursor:"pointer"}}>
            {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
          </select></div>
        <div><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>Stock Qty *</div><input type="number" value={f.stock} onChange={e=>set("stock",e.target.value)} placeholder="50" className="inp"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>Category</div>
          <select value={f.category} onChange={e=>set("category",e.target.value)} className="inp" style={{cursor:"pointer"}}>
            {["Grocery","Dairy","Snacks","Cleaning","Personal Care","Beverages","Stationery","Other"].map(c=><option key={c}>{c}</option>)}
          </select></div>
        <div><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>Unit</div>
          <select value={f.unit} onChange={e=>set("unit",e.target.value)} className="inp" style={{cursor:"pointer"}}>
            {["pkt","kg","g","L","ml","tube","pcs","box","bottle","unit"].map(u=><option key={u}>{u}</option>)}
          </select></div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #E7E5E4",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#78716C"}}>Cancel</button>
        <button className="bp" onClick={save} style={{flex:2,padding:12,fontSize:15}}>{isNew?"➕ Add":"💾 Save"}</button>
      </div>
    </div></div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  REPORTS VIEW
// ═══════════════════════════════════════════════════════════════
function ReportsView({transactions,customers,khata}){
  const today=todayStr();
  const todayTxns=useMemo(()=>transactions.filter(t=>t.date.startsWith(today)),[transactions,today]);
  const totalSales=useMemo(()=>todayTxns.reduce((s,t)=>s+t.total,0),[todayTxns]);
  const totalGST  =useMemo(()=>todayTxns.reduce((s,t)=>s+t.gst,0),[todayTxns]);
  const payBreak  =useMemo(()=>{ const m={Cash:0,UPI:0,Card:0,Udhar:0}; todayTxns.forEach(t=>m[t.paymentMode]=(m[t.paymentMode]||0)+t.total); return m; },[todayTxns]);
  const totalUdhar=useMemo(()=>customers.reduce((s,c)=>s+(c.balance<0?Math.abs(c.balance):0),0),[customers]);
  const week=useMemo(()=>{ const a=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];const tx=transactions.filter(t=>t.date.startsWith(ds));a.push({ds,total:tx.reduce((s,t)=>s+t.total,0),count:tx.length,label:d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"})});} return a; },[transactions]);
  const maxW=Math.max(...week.map(d=>d.total),1);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontWeight:800,fontSize:18,color:"#1C1917"}}>📊 Today's Report — आज की रिपोर्ट</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[["💰","Sales","बिक्री",`₹${totalSales.toFixed(0)}` ,"#F97316","#FFF3E0"],["🧾","Bills","बिल",todayTxns.length,"#3B82F6","#EFF6FF"],["📈","Profit ~","लाभ",`₹${(totalSales*.15).toFixed(0)}`,"#22C55E","#F0FDF4"],["📒","Udhar","बकाया",`₹${totalUdhar.toFixed(0)}`,"#EF4444","#FEF2F2"]].map(([ic,en,hi,val,c,bg])=>(
          <div key={en} style={{background:bg,borderRadius:14,padding:"13px 12px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:22,marginBottom:3}}>{ic}</div>
            <div className="mono" style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{val}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#78716C",marginTop:4}}>{en}</div>
            <div style={{fontSize:10,color:"#A8A29E"}}>{hi}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1C1917",marginBottom:10}}>💳 Payment Breakdown</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[["Cash","💵","#22C55E"],["UPI","📱","#3B82F6"],["Card","💳","#8B5CF6"],["Udhar","📒","#EF4444"]].map(([m,ic,c])=>(
            <div key={m} style={{textAlign:"center",background:"#F8FAFC",borderRadius:10,padding:8}}>
              <div style={{fontSize:18}}>{ic}</div>
              <div className="mono" style={{fontWeight:800,fontSize:13,color:c,marginTop:3}}>₹{(payBreak[m]||0).toFixed(0)}</div>
              <div style={{fontSize:10,color:"#78716C"}}>{m}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1C1917",marginBottom:14}}>📅 Last 7 Days</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:100}}>
          {week.map((d,i)=>{ const pct=Math.max((d.total/maxW)*85,d.total>0?10:3); const isT=i===6;
            return(
              <div key={d.ds} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,height:"100%",justifyContent:"flex-end"}}>
                {d.total>0&&<div style={{fontSize:8,color:isT?"#F97316":"#78716C",fontWeight:700,textAlign:"center"}}>₹{Math.round(d.total)}</div>}
                <div style={{width:"100%",height:`${pct}%`,background:isT?"linear-gradient(180deg,#F97316,#EA580C)":"#E7E5E4",borderRadius:"4px 4px 0 0",minHeight:3}}/>
                <div style={{fontSize:9,color:isT?"#F97316":"#78716C",fontWeight:isT?800:600,textAlign:"center",lineHeight:1.2}}>{d.label}</div>
              </div>
            ); })}
        </div>
      </div>
      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:700,fontSize:14,color:"#1C1917",marginBottom:10}}>🧾 Today's Bills</div>
        {todayTxns.length===0?<div style={{textAlign:"center",padding:24,color:"#A8A29E"}}><div style={{fontSize:32}}>📋</div><div style={{fontWeight:700,marginTop:6}}>No bills today</div></div>:(
          todayTxns.slice(0,10).map(t=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F5F5F4"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#1C1917"}}>{t.customerName||"Walk-in"}</div>
                <div style={{fontSize:11,color:"#78716C"}}>{fmtTime(t.date)} · {t.items.length} items · <span style={{color:t.paymentMode==="Udhar"?"#DC2626":"#22C55E"}}>{t.paymentMode}</span></div>
              </div>
              <div className="mono" style={{fontWeight:800,color:t.paymentMode==="Udhar"?"#DC2626":"#F97316",fontSize:14}}>₹{t.total.toFixed(0)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════
function SettingsView({settings,setSettings,notify}){
  const [f,setF]=useState(settings); const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontWeight:800,fontSize:18,color:"#1C1917"}}>⚙️ Settings — सेटिंग</div>
      <div className="card" style={{padding:20}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1C1917",marginBottom:14}}>🏪 Shop Details</div>
        {[["shopName","Shop Name (English)"],["shopNameHindi","Hindi Name"],["shopAddress","Address"],["shopGST","GSTIN"],["shopPhone","Phone"],["ownerName","Owner Name"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:"#78716C",marginBottom:4}}>{l}</div>
            <input value={f[k]} onChange={e=>set(k,e.target.value)} className="inp"/></div>
        ))}
        <button className="bp" onClick={()=>{setSettings(f);notify("✅ Settings saved!");}} style={{width:"100%",padding:12,fontSize:14,marginTop:4}}>💾 Save Settings</button>
      </div>
      <div style={{background:"#F0FDF4",borderRadius:14,padding:16,border:"1.5px solid #BBF7D0"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#15803D",marginBottom:8}}>✅ v2 Features Active</div>
        <div style={{fontSize:12,color:"#16A34A",lineHeight:2}}>📒 Khata / Udhar Tracking ✓<br/>📲 WhatsApp Bill + Reminders ✓<br/>💰 Cash / UPI / Card / Udhar ✓<br/>📊 Reports with Udhar breakdown ✓<br/>💾 Offline first — 100% works without internet ✓</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  INVOICE MODAL
// ═══════════════════════════════════════════════════════════════
function InvoiceModal({txn,cfg,onClose}){
  const no=`INV-${txn.id.slice(-6).toUpperCase()}`;
  const isUdhar=txn.paymentMode==="Udhar";
  const doPrint=()=>{ const w=window.open("","_blank","width=420,height=650"); w.document.write(buildInvoice(txn,cfg)); w.document.close(); w.focus(); setTimeout(()=>w.print(),500); };
  const doWA=()=>{ const items=txn.items.map(i=>`• ${i.name} ×${i.qty} = ₹${(i.price*i.qty).toFixed(0)}`).join("\n"); const msg=`🧾 *${cfg.shopName}*\n${cfg.shopNameHindi}\n📞 ${cfg.shopPhone}\n\n*Bill: ${no}*\n📅 ${new Date(txn.date).toLocaleString("en-IN")}\n${isUdhar?"📒 *UDHAR BILL*\n":""}\n${items}\n\nGST: ₹${txn.gst.toFixed(2)}\n*TOTAL: ₹${txn.total.toFixed(2)}*\n${isUdhar?"⚠️ Added to Khata\n":""}\nधन्यवाद! 🙏`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); };
  return(
    <div className="overlay">
      <div className="modal" style={{padding:26}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:52,lineHeight:1}}>{isUdhar?"📒":"🎉"}</div>
          <div style={{fontWeight:800,fontSize:22,color:isUdhar?"#DC2626":"#22C55E",marginTop:8}}>{isUdhar?"Udhar Added!":"Sale Complete!"}</div>
          <div style={{fontSize:13,color:"#78716C",marginTop:3}}>{isUdhar?"खाते में जोड़ा गया ✓":"बिक्री सफलतापूर्वक हुई ✓"}</div>
          <div className="mono" style={{fontSize:34,fontWeight:800,color:isUdhar?"#DC2626":"#F97316",marginTop:10,lineHeight:1}}>₹{txn.total.toFixed(2)}</div>
          <div style={{fontSize:12,color:"#A8A29E",marginTop:4}}>{txn.paymentMode} · {fmtTime(txn.date)}</div>
        </div>
        <div style={{background:"#F8FAFC",borderRadius:13,padding:14,marginBottom:16,border:"1px solid #E2E8F0",fontSize:12}}>
          <div style={{fontWeight:700,color:"#F97316",textAlign:"center",fontSize:13,marginBottom:3}}>{cfg.shopName}</div>
          {txn.items.map((i,idx)=><div key={idx} style={{display:"flex",justifyContent:"space-between",marginBottom:3,color:"#475569"}}><span>{i.name} ×{i.qty}</span><span className="mono">₹{(i.price*i.qty).toFixed(0)}</span></div>)}
          <div style={{borderTop:"1px dashed #CBD5E1",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:800,color:"#F97316",fontSize:14}}><span>TOTAL</span><span className="mono">₹{txn.total.toFixed(2)}</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={doPrint} className="bp" style={{width:"100%",padding:13,fontSize:15}}>🖨️ Print Bill</button>
          <button onClick={doWA} style={{width:"100%",padding:13,fontSize:15,background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",border:"none",borderRadius:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>📲 Share on WhatsApp</button>
          <button onClick={onClose} style={{width:"100%",padding:12,borderRadius:12,border:"2px solid #E7E5E4",background:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",color:"#78716C"}}>➕ New Bill</button>
        </div>
      </div>
    </div>
  );
}