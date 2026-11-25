import{c as D,b as u,m as C}from"./index-acbbc146.js";import"./vendor-2e1558b1.js";import"./firebase-3167fd09.js";const L=(o,e,n={})=>{const r=D(e),a=u(e).sort((s,g)=>String(s.date).localeCompare(String(g.date)));let t="";a.forEach(s=>{const g=s.date?new Date(s.date).toLocaleDateString("ko-KR"):"";t+=`
                    <div style="background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
                            <span style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 8px 20px; border-radius: 25px; font-weight: bold; font-size: 18px;">${s.readCount?`${s.readCount}독 · `:""}DAY ${s.day}</span>
                            <span style="color: #64748b; font-size: 16px;">${g}</span>
                        </div>
                        <div style="color: #475569; font-size: 17px; font-weight: 600; margin-bottom: 16px;">${s.title||""}</div>
                        <div style="color: #1e293b; font-size: 18px; line-height: 1.9; white-space: pre-wrap;">${s.text}</div>
                    </div>
                `});const d=`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${o}의 묵상 기록</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
        font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif;
        background: linear-gradient(180deg, #f0f4ff 0%, #fdf4ff 100%);
        min-height: 100vh;
        padding: 20px;
        -webkit-text-size-adjust: 100%;
    }
    .container { max-width: 600px; margin: 0 auto; }
    @media print {
        body { background: white; padding: 0; }
        .no-print { display: none; }
    }
</style>
</head>
<body>
<div class="container">
    <!-- 표지 -->
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 24px; padding: 50px 30px; text-align: center; color: white; margin-bottom: 30px;">
        <div style="font-size: 60px; margin-bottom: 20px;">📖</div>
        <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">${o}</div>
        <div style="font-size: 22px; opacity: 0.9;">2025 묵상 기록</div>
        <div style="font-size: 16px; opacity: 0.7; margin-top: 10px;">성경통독 365</div>
    </div>
    
    <!-- 통계 -->
    <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
        <h2 style="text-align: center; font-size: 24px; color: #1e293b; margin-bottom: 25px;">📊 나의 기록</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #f0f4ff; padding: 25px; border-radius: 16px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #4f46e5;">${r}</div>
                <div style="color: #64748b; font-size: 16px; margin-top: 5px;">작성한 묵상</div>
            </div>
            <div style="background: #f0fdf4; padding: 25px; border-radius: 16px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #059669;">${n.currentDay||1}</div>
                <div style="color: #64748b; font-size: 16px; margin-top: 5px;">현재 Day</div>
            </div>
            <div style="background: #fef2f2; padding: 25px; border-radius: 16px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #dc2626;">${n.score||0}</div>
                <div style="color: #64748b; font-size: 16px; margin-top: 5px;">총 점수</div>
            </div>
            <div style="background: #fffbeb; padding: 25px; border-radius: 16px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${n.streak||0}</div>
                <div style="color: #64748b; font-size: 16px; margin-top: 5px;">연속 일수</div>
            </div>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 20px;">
            생성일: ${new Date().toLocaleDateString("ko-KR")}
        </div>
    </div>
    
    <!-- 묵상 목록 -->
    ${a.length>0?`
        <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 20px; padding-left: 10px;">✍️ 나의 묵상</h2>
        ${t}
    `:`
        <div style="text-align: center; padding: 50px; color: #94a3b8;">
            <div style="font-size: 50px; margin-bottom: 15px;">📝</div>
            <div style="font-size: 18px;">아직 작성한 묵상이 없습니다.</div>
        </div>
    `}
    
    <!-- 마무리 -->
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 24px; padding: 40px 30px; text-align: center; color: white; margin-top: 30px;">
        <div style="font-size: 50px; margin-bottom: 20px;">🎉</div>
        <div style="font-size: 26px; font-weight: bold; margin-bottom: 15px;">축하합니다!</div>
        <div style="font-size: 16px; opacity: 0.9; line-height: 1.8; margin-bottom: 20px;">
            "그러므로 우리에게 구름 같이 둘러싼<br>
            허다한 증인들이 있으니 모든 무거운 것과<br>
            얽매이기 쉬운 죄를 벗어버리고<br>
            인내로써 우리 앞에 당한 경주를 하며"
        </div>
        <div style="font-size: 18px; opacity: 0.8;">- 히브리서 12:1 -</div>
    </div>
    
    <div style="text-align: center; padding: 30px; color: #94a3b8; font-size: 14px;">
        천로역정 성경 레이스 🏃
    </div>
</div>
</body>
</html>`,i=new Blob([d],{type:"text/html;charset=utf-8"}),l=URL.createObjectURL(i),f=document.createElement("a");f.href=l,f.download=`${o}_묵상기록_2025.html`,f.click(),URL.revokeObjectURL(l)},O=(o,e=!1)=>{const n=Array.isArray(o)?o:[];return n.reduce((a,t)=>{const d=Math.max(Number(t&&t.memoCount)||0,D(t&&t.memos||{}));return a+Math.max(1,d)},0)+(e?n.length:0)},_=async(o,e)=>{if(o)try{const n=Array.isArray(e)&&e.length>0?e.map(i=>({id:i.uid,data:i})):(await o.collection("users").get()).docs.map(i=>({id:i.id,data:i.data()}));let r=`Name,Subgroup,ReadCount,Day,Date,Title,Memo
`;for(const{id:i,data:l}of n){const f=l.name||"Unknown",s=l.subgroupId||"-",g=await o.collection("users").doc(i).collection("memos").get();[...u(l.memos||{}),...g.docs.map(c=>({id:c.id,...c.data()}))].forEach(c=>{const x=c.date?new Date(c.date).toLocaleDateString("ko-KR"):"",h=(c.title||"").replace(/,/g,";").replace(/\n/g," "),m=(c.text||"").replace(/,/g,";").replace(/\n/g," ");r+=`"${f}","${s}","${c.readCount||""}","${c.day}","${x}","${h}","${m}"
`})}const a=new Blob(["\uFEFF"+r],{type:"text/csv;charset=utf-8;"}),t=URL.createObjectURL(a),d=document.createElement("a");d.href=t,d.download=`all_memos_${new Date().toISOString().split("T")[0]}.csv`,d.click(),URL.revokeObjectURL(t)}catch(n){console.error("CSV 생성 오류:",n),alert("CSV 생성 중 오류가 발생했습니다.")}},j=async(o,e)=>{const n=await o.collection("users").doc(e.uid).collection("memos").get(),r=C([...u(e.memos||{}),...n.docs.map(a=>({id:a.id,...a.data()}))]);L(e.name,r,{currentDay:e.currentDay,score:e.score,streak:e.streak})},F=o=>{if(o.length===0){alert("데이터가 없습니다.");return}let e=`\uFEFF이름,부서,소그룹,현재Day,총점수,연속일수,마지막읽은날,플랜ID
`;o.forEach(t=>{e+=`${t.name},${t.communityName},${t.subgroupId},${t.currentDay},${t.score},${t.streak},${t.lastReadDate||"없음"},${t.planId||"1year_revised"}\r
`});const n=new Blob([e],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(n),a=document.createElement("a");a.href=r,a.download=`성경통독_전체기록_${new Date().toISOString().slice(0,10)}.csv`,a.click(),URL.revokeObjectURL(r)},v=o=>'"'+String(o??"").replace(/"/g,'""')+'"',T=async(o,e,n,r)=>{if(!o)return;if(!n||!r){alert("시작일과 종료일을 모두 선택해주세요.");return}const a=new Date(n);a.setHours(0,0,0,0);const t=new Date(r);if(t.setHours(23,59,59,999),a>t){alert("시작일이 종료일보다 클 수 없습니다.");return}try{const d=[];let i=new Date(a);for(;i<=t;){const p=i.getFullYear(),c=String(i.getMonth()+1).padStart(2,"0"),x=String(i.getDate()).padStart(2,"0");d.push(`${p}-${c}-${x}`),i.setDate(i.getDate()+1)}let l="\uFEFF이름,부서,소그룹,총읽은횟수(Day분량)";d.forEach(p=>{l+=`,${p}`}),l+=`\r
`;for(const p of e){let c=0;const x={};d.forEach(m=>x[m]=0);const h=Array.isArray(p.readHistory)?p.readHistory:[];for(let m=0;m<h.length;m++){const y=h[m],w=typeof y=="string"?y:y.date;if(!w)continue;const b=new Date(w);if(!isNaN(b.getTime())&&b>=a&&b<=t){const S=b.getFullYear(),z=String(b.getMonth()+1).padStart(2,"0"),R=String(b.getDate()).padStart(2,"0"),$=`${S}-${z}-${R}`;if(x[$]!==void 0){const k=typeof y=="string"?1:y.daysRead||1;x[$]+=k,c+=k}}}l+=`${v(p.name)},${v(p.communityName||"-")},${v(p.subgroupId||"-")},${v(c)}`,d.forEach(m=>{l+=`,${v(x[m]||0)}`}),l+=`\r
`}const f=new Blob([l],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(f),g=document.createElement("a");g.href=s,g.download=`성경통독_기간별통계_${n}_to_${r}.csv`,g.click(),URL.revokeObjectURL(s)}catch(d){console.error("기간별 통계 CSV 생성 오류:",d),alert("CSV 생성 중 오류가 발생했습니다.")}};export{F as downloadCSV,T as downloadPeriodStatsCSV,O as estimateMemosCSVReads,_ as generateMemosCSV,L as generateMemosHTML,j as generateUserMemosHTML};
