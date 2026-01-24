<div class="empty-state">
    <div class="spinner"></div>
    <p>${e ? "Laddar lektionsquiz..." : "Laddar quiz..."}</p>
</div>
`,setTimeout(()=>{try{if(B=0,j=0,k=0,u=Fe(e),u.length===0){const t=e==="review"||a==="review",n="Du har inga sparade misstag att repetera! Bra jobbat! 🎉",o="ليس لديك أخطاء محفوظة لمراجعتها! أحسنت! 🎉",d="Inga frågor tillgängliga för detta urval.",s="لا توجد أسئلة متاحة لهذا الاختيار.";r.innerHTML=`
    < div class="empty-state" >
                        <p class="sv-text">${t?n:d}</p>
                        <p class="ar-text">${t?o:s}</p>
                        <button class="retry-btn" onclick="switchMode('browse')">Tillbaka / رجوع</button>
                        ${ t ? '<button class="secondary-btn" onclick="openRandomQuiz()" style="margin-top:1rem;background:none;border:1px solid #475569;color:#cbd5e1;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;">Starta slumpmässigt quiz</button>' : "" }
                    </div >
    `;return}be()}catch(t){console.error("[LearnUI] Quiz generation failed:",t),r.innerHTML=`
    < div class="empty-state" >
                    <p>Ett fel uppstod när quizet skulle laddas.</p>
                    <p class="text-xs text-muted">${t}</p>
                    <button class="retry-btn" onclick="location.reload()">Ladda om</button>
                </div >
    `}},50))}function Fe(e){const a=[];if(e==="review"?m.forEach(d=>{d.sections.forEach(s=>{s.examples.forEach(i=>{if(!i.swe||!i.arb||!i.swe.trim()||!i.arb.trim())return;const l=A(i.swe);x.has(l)&&a.push(i)})})}):(e?m.filter(s=>s.id===e):m).forEach(s=>{s.sections.forEach(i=>{i.examples.forEach(l=>{l.swe&&l.arb&&l.swe.trim()&&l.arb.trim()&&a.push(l)})})}),a.length<4&&e!=="review"&&!(e&&a.length>0))return[];const r=[...a].sort(()=>Math.random()-.5),t=r.slice(0,Math.min(r.length,10)),n=[];return m.forEach(d=>d.sections.forEach(s=>{s.examples.forEach(i=>{i.swe&&i.arb&&i.swe.trim()&&i.arb.trim()&&n.push(i)})})),t.map(d=>{const s=Math.random()<.5?"swe-to-arb":"arb-to-swe",i=s==="swe-to-arb",l=i?d.swe:d.arb,g=i?d.arb:d.swe,c=n.filter(J=>J.swe!==d.swe),T=[...c].sort(()=>Math.random()-.5).slice(0,3).map(J=>i?J.arb:J.swe),p=Array.from(new Set([...T,g]));for(;p.length<4&&c.length>p.length;){const J=c[Math.floor(Math.random()*c.length)],Y=i?J.arb:J.swe;p.includes(Y)||p.push(Y)}return[...p].sort(()=>Math.random()-.5),{question:l,answer:g,options:[...p].sort(()=>Math.random()-.5),type:s,example:d}})}let j=0;function be(){const e=document.getElementById("quizContent");if(!e||!u[k])return;const a=u[k],r=k/u.length*100;e.innerHTML=`
    < div class="quiz-header" >
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${r}%"></div>
            </div>
            <div class="quiz-stats-row">
                <div class="quiz-stat-item">
                    <span>📝</span>
                    <span>${k+1}/${u.length}</span>
                </div>
                <div class="quiz-stat-item">
                    <span>🏆</span>
                    <span>${B}</span>
                </div>
                <div class="quiz-stat-item streak-container ${j>2?"active":""}">
                    <span>🔥</span>
                    <span id="streakCounter">${j}</span>
                </div>
            </div >
        </div >

    <div class="question-card">
        <div class="question-text ${a.type===" arb-to-swe"?"ar-text":"sv-text"}" dir="${a.type === "arb-to-swe" ? "rtl" : "ltr"}">
        ${a.question}
    </div>
        </div >

    <div class="options-grid">
        ${a.options.map(t => `
                <button class="option-btn ${a.type === "swe-to-arb" ? "ar-text" : "sv-text"}" 
                        onclick="checkAnswer(this.textContent.trim())" 
                        dir="${a.type === "swe-to-arb" ? "rtl" : "ltr"}">
                    ${t}
                </button>
                `).join("")}
    </div>
`,typeof window.twemoji<"u"&&window.twemoji.parse(e,{folder:"svg",ext:".svg"})}function $e(e){var o,d;const a=u[k],r=document.querySelectorAll(".option-btn"),t=M.getInstance();let n=e===a.answer;if(r.forEach(s=>{var l;const i=(l=s.textContent)==null?void 0:l.trim();i===a.answer?(s.classList.add("correct-answer"),n&&(t.play("correct"),s.animate([{transform:"scale(1)"},{transform:"scale(1.05)",backgroundColor:"rgba(34, 197, 94, 0.4)"},{transform:"scale(1)"}],{duration:300}))):i===e&&!n&&(s.classList.add("wrong-answer"),t.play("wrong"),navigator.vibrate&&navigator.vibrate(200),s.animate([{transform:"translateX(0)"},{transform:"translateX(-5px)"},{transform:"translateX(5px)"},{transform:"translateX(-5px)"},{transform:"translateX(0)"}],{duration:400})),s.disabled=!0}),n){B++,j++;const s=A(a.example.swe);He(s);let i=5;if(j>=3){i+=2,j%3===0&&t.play("streak");const l=document.getElementById("streakCounter");l&&((o=l.parentElement)==null||o.classList.add("active"),(d=l.parentElement)==null||d.animate([{transform:"scale(1)"},{transform:"scale(1.5)",textShadow:"0 0 20px #f97316"},{transform:"scale(1)"}],{duration:400,easing:"cubic-bezier(0.175, 0.885, 0.32, 1.275)"}))}K(i)}else{j=0;const s=A(a.example.swe);Le(s)}setTimeout(()=>{k++,k<u.length?be():Ce()},1500)}function Ce(){const e=document.getElementById("quizContent");if(!e)return;const a=M.getInstance(),t=B/u.length*100>=70;t&&a.play("win"),e.innerHTML=`
    < div class="quiz-results-overlay" >
        <div class="quiz-results-card">
            <span class="result-icon-large">${t ? "🎉" : "💪"}</span>
            <h2 style="font-size: 1.5rem; margin-bottom:0.5rem;">${t ? "Fantastiskt!" : "Bra kämpat!"}</h2>
            <div class="result-score-large">${B}<span style="font-size:1.5rem; color:#94a3b8;">/${u.length}</span></div>
            <p style="color:var(--text-muted); margin-bottom: 2rem;">
                ${t ? "Du klarade det galant!" : "Övning ger färdighet. Försök igen!"}
            </p>

            <div class="result-actions" style="display:flex; flex-direction:column; gap:0.75rem;">
                <button class="primary-btn" onclick="initQuiz('${O||""}')" style="width:100%; justify-content:center;">
                ${t ? "Spela igen / العودة" : "Försök igen / حاول مرة أخرى"}
            </button>
            <button class="secondary-btn" onclick="switchMode('browse')" style="width:100%; justify-content:center; background:rgba(255,255,255,0.05);">
                Avsluta / إنهاء
            </button>
        </div>
            </div >
        </div >
    `,t&&window.confetti&&window.confetti({particleCount:100,spread:70,origin:{y:.6}})}function Ae(){if(ne)return;console.log("[LearnUI] Initializing Flashcards...");const e=document.getElementById("flashcardContent");e&&(e.innerHTML=`
    < div class="empty-state" >
        <p>Blandar kort...</p>
        </div >
    `,setTimeout(()=>{let a=new Set;try{const o=localStorage.getItem("snabbaLexin_mastered");o&&(a=new Set(JSON.parse(o)))}catch(o){console.warn("Failed to load mastered words:",o)}const r=[];m.forEach(o=>{o.sections.forEach(d=>{r.push(...d.examples)})});const t=r.filter(o=>{const d=o.swe?o.swe.toLowerCase().replace(/\s+/g,"_"):"";return!a.has(d)});if(b=[...t.length>0?t:r].sort(()=>Math.random()-.5).slice(0,15),w=0,v=!1,b.length===0){e.innerHTML='<div class="empty-state">Inga ord att träna på. Lägg till ord från ordboken!</div>';return}R()},50))}async function W(){console.log("[LearnUI] Starting Training Session..."),ne=!0,P("flashcard");const e=document.getElementById("flashcardContent");e&&(e.innerHTML='<div class="empty-state"><p>Hämtar dina ord...</p></div>');try{const a=await q.getTrainingWords();if(!a||a.length===0){e&&(e.innerHTML=`
    < div class="empty-state" >
                    <div class="emoji-lg">💪</div>
                    <h3>Inga ord än</h3>
                    <p>Markera ord med "💪" i ordboken för att träna på dem här.</p>
                </div >
    `);return}b=a.map(r=>{const t=Array.isArray(r);return{id:t?r[0]:r.id||"",swe:t?r[2]:r.swe||"",arb:t?r[3]:r.arb||"",type:t?r[1]:r.type||"",exSwe:t?r[7]||"":r.sweEx||"",exArb:t?r[8]||"":r.arbEx||"",isTraining:!0}}),w=0,v=!1,R()}catch(a){console.error("Error starting training:",a)}}function R(){const e=document.getElementById("flashcardContent");if(!e)return;if(w>=b.length){Ke();return}const a=b[w],r=w/b.length*100,t=a.exSwe&&a.exSwe.length>2,n=a.exArb&&a.exArb.length>2;e.innerHTML=`
    < div class="flashcard-header" >
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${r}%"></div>
            </div>
            <div class="flashcard-counter">${w+1} / ${b.length}</div>
        </div >

    <div class="flashcard-wrapper ${v?" flipped":""}" onclick = "flipFlashcard()" >
            <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front">
                    <div class="flashcard-word sv-text" lang="sv">${a.swe}</div>
                    ${t?`<div class="flashcard-example sv-text">"${a.exSwe}"</div>`:""}
                    <div class="flashcard-hint">
                        <span class="pulse-icon">👆</span> Klicka för att vända / انقر للقلب
                    </div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div class="flashcard-translation" dir="rtl" lang="ar">${a.arb}</div>
                    ${n?`<div class="flashcard-example" dir="rtl">${a.exArb}</div>`:""}
                    <div class="flashcard-hint">
                        <span class="pulse-icon">👆</span> Klicka för att vända / انقر للقلب
                    </div>
            </div>
        </div>

        <div class="flashcard-controls">
            <button class="fc-btn fc-btn-dont-know" onclick="nextFlashcard(false, event)">
                ❌ Vet ej / لا أعرف
            </button>
            
            <button class="fc-btn fc-btn-know" onclick="nextFlashcard(true, event)">
                ✅ Kan det / أعرفها
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.8rem;">
            <p>Space: Vänd • ⬅️ Vet ej • ➡️ Kan det</p>
    `,window.hasFlashcardListeners||(document.addEventListener("keydown",qe),window.hasFlashcardListeners=!0)}function qe(e){document.getElementById("flashcardContent")&&(e.code==="Space"?(e.preventDefault(),ge()):e.code==="ArrowLeft"?Q(!1):e.code==="ArrowRight"&&Q(!0))}function ge(){v=!v;const e=document.querySelector(".flashcard-wrapper");e&&(v?e.classList.add("flipped"):e.classList.remove("flipped"))}function Q(e=!1,a){a&&a.stopPropagation();const r=document.querySelector(".flashcard-wrapper");if(r&&!e&&(r.classList.add("animate-dont-know"),M.getInstance().play("wrong"),navigator.vibrate&&navigator.vibrate(50)),e){ce(b[w].id);return}setTimeout(()=>{v=!1,w=(w+1)%b.length,R()},300)}async function ce(e){const a=document.querySelector(".flashcard-wrapper");a&&(a.classList.add("animate-mastered"),setTimeout(async()=>{try{if(e){await q.updateTrainingStatus(e,!1);try{const r=localStorage.getItem("snabbaLexin_mastered"),t=r?new Set(JSON.parse(r)):new Set;t.add(e),localStorage.setItem("snabbaLexin_mastered",JSON.stringify([...t]))}catch(r){console.warn("Failed to save to localStorage:",r)}}}catch(r){console.error("Failed to update DB:",r)}if(b.splice(w,1),b.length===0){const r=document.getElementById("flashcardContent");r&&(r.innerHTML=`
                <div class="empty-state">
                    <div class="emoji-lg">🎉</div>
                    <h3>Bra jobbat!</h3>
                    <p>Du har tränat klart alla dina ord.</p>
                    <button class="primary-btn" onclick="switchMode('browse')">Tillbaka</button>
                </div>
            `);return}w>=b.length&&(w=0),v=!1,R()},600))}function Ke(){const e=document.getElementById("flashcardContent");e&&(e.innerHTML=`
        <div class="quiz-results">
            <div class="result-icon">🎓</div>
            <h2>Flashcards klara!</h2>
            <p>Du har gått igenom ${b.length} kort.</p>
            <div class="result-actions">
                <button class="primary-btn" onclick="initFlashcards()">Börja om / ابدأ من جديد</button>
                <button class="secondary-btn" onclick="switchMode('browse')">Klar / تم</button>
            </div>
        </div>
    `)}function Pe(){console.log("[LearnUI] Rendering Saved Lessons...");const e=document.getElementById("savedList");if(!e)return;e.innerHTML="";const a=m.filter(t=>H.has(t.id));if(a.length===0){e.innerHTML=`
            <div class="empty-state">
                <p class="sv-text">Du har inte slutfört några lektioner än.</p>
                <p class="ar-text">لم تكمل أي دروس بعد.</p>
            </div>
        `;return}const r=document.createDocumentFragment();a.forEach(t=>{const n=document.createElement("div");for(n.innerHTML=me(t);n.firstChild;)r.appendChild(n.firstChild)}),e.appendChild(r),requestAnimationFrame(()=>{typeof window.twemoji<"u"&&window.twemoji.parse(e,{folder:"svg",ext:".svg"})})}function y(e=!1){const a=document.getElementById("lessonsGrid");if(!a){console.error("[LearnUI] Lessons grid not found");return}let r=m;if(z!=="all"&&(r=m.filter(s=>s.level===z)),_){const s=_.toLowerCase().trim(),i=X(s);r=r.filter(l=>l.title.toLowerCase().includes(s)||l.id.toLowerCase().includes(s)?!0:l.sections.some(g=>g.title.toLowerCase().includes(s)||g.content.some(c=>c.html.toLowerCase().includes(s))?!0:g.examples.some(c=>{const T=c.swe.toLowerCase(),p=X(c.arb);return T.includes(s)||p.includes(i)})))}e||($=ae,a.innerHTML="",window.scrollTo({top:0,behavior:"instant"}));const t=e?$:0;e&&($+=ae);const n=$,o=r.slice(t,n);if(o.length===0&&e)return;console.log(`[LearnUI] Rendering batch ${t}-${n} (Total: ${r.length})`);const d=o.map(s=>me(s)).join("");if(e){const s=document.getElementById("lessons-sentinel");s&&s.remove(),a.insertAdjacentHTML("beforeend",d)}else a.innerHTML=d;if(n<r.length){const s=document.createElement("div");s.id="lessons-sentinel",s.style.height="50px",s.style.width="100%",a.appendChild(s),D&&D.observe(s)}requestAnimationFrame(()=>{typeof window.twemoji<"u"&&window.twemoji.parse(a,{folder:"svg",ext:".svg"})})}function me(e){const a=H.has(e.id),r={beginner:"🟢",intermediate:"🟡",advanced:"🔴"};let t="";a&&(t=`
            <div class="mastery-stars">
                <span class="star active">★</span>
                <span class="star active">★</span>
                <span class="star active">★</span>
            </div>
        `);const n=window.t,o=n?n("learn.sections"):"avsnitt",d=o==="learn.sections"||!o?"avsnitt":o,s=`${e.sections.length} ${d}`,i=`${Math.max(3,e.sections.length*2)} min`,l=e.id==="wordOrder"?"ترتيب الكلمات - قاعدة V2":e.id==="verbs"?"الأفعال والأزمنة":e.id==="pronouns"?"الضمائر الشخصية":e.id==="adjectives"?"الصفات - التذكير والتأنيث":"درس قواعد";return`
        <div class="lesson-card search-result-style ${a?"completed":""}" 
             onclick="openLesson('${e.id}')" 
             data-level="${e.level}"
             onmousemove="handleCardTilt(event, this)"
             onmouseleave="resetCardTilt(this)">
             
            <div class="lesson-card-header">
                <div class="lesson-text-group">
                    <h2 class="lesson-title search-result-title">${e.title}</h2>
                    <span class="lesson-level-badge ${e.level}">${r[e.level]||"📚"} ${e.level}</span>
                </div>
                ${a?'<span class="check-icon">✓</span>':""}
            </div>
            
            <p class="lesson-subtitle-arb" dir="rtl">${l}</p>
            
            <div class="lesson-meta-row">
                <span class="meta-item"><span class="icon">📄</span> ${s}</span>
                <span class="meta-item"><span class="icon">⚡</span> ${i}</span>
            </div>

            ${t}

            <div class="lesson-progress-bar">
                <div class="lesson-progress-fill" style="width: ${a?"100":"0"}%"></div>
            </div>
        </div >
    `}let h=null,C=null;window.addEventListener("resize",()=>{h=null,C=null});function Re(e,a){if(C!==a&&(h=a.getBoundingClientRect(),C=a),!h)return;const r=e.clientX-h.left,t=e.clientY-h.top;requestAnimationFrame(()=>{a.style.setProperty("--mouse-x",`${ r } px`),a.style.setProperty("--mouse-y",`${ t } px`);const n=h.width/2,o=h.height/2,d=(t-o)/o*-10,s=(r-n)/n*10;a.style.transform=`perspective(1000px) rotateX(${ d }deg) rotateY(${ s }deg) scale(1.02)`})}function Ne(e){e.style.transform="perspective(1000px) rotateX(0) rotateY(0) scale(1)",C=null,h=null}async function we(e){const a=m.find(o=>o.id===e);if(!a)return;await ze();const r=document.getElementById("lessonModal"),t=document.getElementById("modalTitle"),n=document.getElementById("lessonContent");r&&r.classList.add("active"),t&&(t.textContent=a.title),n&&(n.innerHTML=Oe(a)),K(5)}function Oe(e){return`
        < div class="lesson-sections" >
            ${
                e.sections.map((a, r) => `
                <div class="lesson-section" data-section="${r}">
                    <h3 class="section-title">${a.title}</h3>
                    
                    ${a.content.map(t => `
                        <div class="content-item ${t.type}">
                            ${t.html}
                        </div>
                    `).join("")}
                    
                    ${a.examples.length > 0 ? `
                        <div class="examples-list">
                            ${re(a.examples.slice(0, 10))}
                            
                            ${a.examples.length > 10 ? `
                                <button class="show-more-btn" onclick="this.parentElement.classList.add('expanded'); this.remove();">
                                    Visa ${a.examples.length - 10} till...
                                </button>
                                <div class="more-examples">
                                    ${re(a.examples.slice(10))}
                                </div>
                            `: ""}
                        </div>
                    `: ""}
                </div>
            `).join("")
}

<div class="lesson-actions">
    <button class="quiz-lesson-btn" onclick="startLessonQuiz('${e.id}')">
        🧠 <span class="sv-text">Testa dig själv</span><span class="ar-text">اختبر نفسك</span>
    </button>
    <div class="spacer" style="width: 12px;"></div>
    <button class="complete-lesson-btn" onclick="completeLesson('${e.id}')">
        ✅ <span class="sv-text">Markera som klar</span><span class="ar-text">اكتمل</span>
    </button>
</div>
        </div >
    `}function re(e){return e.map(a=>{let r=Me(a.swe),t="";r||(r=A(a.swe),t=encodeURIComponent(JSON.stringify(a)));const n=r&&V.has(r);return`
    < div class="example-item" >
                <div class="example-swe">
                    <button class="speak-btn" onclick="speakText('${a.swe.replace(/'/g,"\\'")}', 'sv')">🔊</button>
                    <span>${a.swe}</span>
                </div >
    <div class="example-actions-row">
        <div class="example-arb">${a.arb}</div>
        <button class="train-mini-btn ${n?" active":""}"
        onclick="toggleTrainingWord('${r}', this, '${t}')"
                            aria-label="Träna / تدريب">
        ${n ? "🧠" : "💪"}
    </button>
                </div >
            </div >
    `}).join("")}function Ue(e){H.has(e)||(H.add(e),K(20),F(),y()),N()}function N(){const e=document.getElementById("lessonModal");e&&e.classList.remove("active")}function G(e,a){if(typeof U<"u"&&U)U.speak(e,a);else{const r=new SpeechSynthesisUtterance(e);r.lang=a==="sv"?"sv-SE":"ar-SA",speechSynthesis.speak(r)}}function _e(){const e=document.querySelectorAll(".filter-chip");e.forEach(a=>{a.addEventListener("click",()=>{e.forEach(r=>r.classList.remove("active")),a.classList.add("active"),a.classList.add("active"),z=a.getAttribute("data-filter")||"all",z==="training"?W():y()})})}function te(){const e=document.getElementById("lessonSearchInput");if(e){const t=Je(()=>{_=e.value,y()},300);e.addEventListener("input",t)}const a=document.getElementById("filterToggleBtn"),r=document.querySelector(".filter-scroll-container");a&&r&&a.addEventListener("click",()=>{r.classList.contains("expanded")?(r.classList.remove("expanded"),a.classList.remove("active")):(r.classList.add("expanded"),a.classList.add("active"))})}function pe(){console.log("[LearnUI] Opening random quiz...");const e=m[Math.floor(Math.random()*m.length)];we(e.id)}function Qe(){console.log("[LearnUI] Opening daily challenge..."),pe(),K(10)}function Ge(){const e=document.getElementById("wodWord"),a=document.getElementById("wodExampleSwe");e&&(G(e.textContent||"","sv"),a&&setTimeout(()=>{G(a.textContent||"","sv")},1500))}function We(e){document.querySelectorAll(".filter-chip").forEach(t=>{t.getAttribute("data-filter")===e?t.classList.add("active"):t.classList.remove("active")}),z=e,y();const r=document.getElementById("lessonsGrid");r&&r.scrollIntoView({behavior:"smooth"})}function ue(){console.log("[LearnUI] Opening review session..."),x.size,N(),P("quiz"),O="review"}function Ye(e){N(),P("quiz"),O=e}let O=null;function Xe(){window.startLessonQuiz=Ye,window.openLesson=we,window.closeLessonModal=N,window.completeLesson=Ue,window.speakText=G,window.openRandomQuiz=pe,window.openDailyChallenge=Qe,window.speakWordOfDay=Ge,window.setPathFilter=We,window.openReviewSession=ue,window.handleCardTilt=Re,window.resetCardTilt=Ne,window.switchMode=P,window.initQuiz=de,window.checkAnswer=$e,window.flipFlashcard=ge,window.nextFlashcard=Q,window.toggleTrainingWord=Ze,window.markAsMastered=ce,window.startTrainingSession=W}async function Ze(e,a){if(e)try{const r=!V.has(e);r?(V.add(e),a.classList.add("active"),a.textContent="🧠"):(V.delete(e),a.classList.remove("active"),a.textContent="💪"),await q.updateTrainingStatus(e,r)}catch(r){console.error("Failed to toggle training:",r)}}async function ea(){const e=document.getElementById("wodWord"),a=document.getElementById("wodTranslation"),r=document.getElementById("wodExampleSwe"),t=document.getElementById("wodExampleArb"),n=document.querySelector(".wod-category"),o=document.getElementById("wodDate");if(!e)return;try{const{DictionaryDB:i}=await xe(async()=>{const{DictionaryDB:g}=await import("./db-D9nATt-F.js");return{DictionaryDB:g}},__vite__mapDeps([0,1]));await i.init();const l=await i.getRandomWord();if(l){const g=l.swedish||l.swe||"???",c=l.arabic||l.arb||"???";console.log("[LearnUI] Word of the Day:",g,l),e&&(e.textContent=g),a&&(a.textContent=c);const T=l.example||l.sweEx||`${ g } är ett bra ord.`,p=l.example_ar||l.arbEx||`كلمة ${ c } كلمة جيدة.`;r&&(r.textContent=T),t&&(t.textContent=p),n&&(n.textContent=`🏷️ ${ l.type || "Ord" } `)}else console.warn("[LearnUI] No words found in DB for Word of the Day"),e&&(e.textContent="Välkommen"),a&&(a.textContent="مرحباً")}catch(i){console.error("[LearnUI] Failed to load Word of the Day:",i)}const d=new Date,s={day:"numeric",month:"long"};o&&(o.textContent=d.toLocaleDateString("sv-SE",s))}function A(e){let a=0;for(let r=0;r<e.length;r++){const t=e.charCodeAt(r);a=(a<<5)-a+t,a=a&a}return"cust_"+Math.abs(a).toString(36)}function aa(){console.log("[LearnUI] Initializing..."),Ve(),Ie(),Xe(),_e(),te(),se(),y(),te(),se(),y(),fe(),ea(),new URLSearchParams(window.location.search).get("mode")==="training"&&setTimeout(()=>{const r=document.querySelector(".filter-training");r?r.click():W()},100),console.log("[LearnUI] Initialized successfully")}function se(){D&&D.disconnect(),D=new IntersectionObserver(e=>{e[0].isIntersecting&&requestAnimationFrame(()=>{y(!0)})},{root:null,rootMargin:"300px",threshold:.1})}function fe(){const e=document.querySelector(".filters-scroll");if(!e)return;let a=document.getElementById("btn-review-mistakes");const r=x.size;r>0?(a||(a=document.createElement("button"),a.id="btn-review-mistakes",a.className="filter-chip",a.style.background="rgba(239, 68, 68, 0.2)",a.style.borderColor="rgba(239, 68, 68, 0.5)",a.style.color="#fca5a5",a.onclick=ue,e.insertBefore(a,e.firstChild)),a.innerHTML=`🧠 Review(${ r })`,a.style.display="inline-flex"):a&&(a.style.display="none")}const he=document.createElement("style");he.textContent=`
        /* --- Premium Lesson Card Styling --- */
        .lesson - card {
    display: flex;
    flex - direction: column;
    align - items: flex - start; /* Force children to left */
    text - align: left;        /* Force text to left */
    background: rgba(30, 41, 59, 0.7);
    backdrop - filter: blur(12px);
    -webkit - backdrop - filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border - radius: 24px;
    padding: 1.5rem;
    cursor: pointer;
    transition: transform 0.4s cubic - bezier(0.175, 0.885, 0.32, 1.275),
        box - shadow 0.4s ease,
            border - color 0.3s ease;
    position: relative;
    overflow: hidden;
    box - shadow: 0 4px 6px - 1px rgba(0, 0, 0, 0.1), 0 2px 4px - 1px rgba(0, 0, 0, 0.06);
    transform - style: preserve - 3d;
}
    
    .lesson - card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial - gradient(circle at var(--mouse - x, 50 %) var(--mouse - y, 50 %),
        rgba(96, 165, 250, 0.15) 0 %,
            transparent 50 %);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer - events: none;
    z - index: 1;
}

    .lesson - card: hover::before {
    opacity: 1;
}
    
    .lesson - card:hover {
    transform: translateY(-5px) scale(1.01);
    box - shadow: 0 10px 20px - 5px rgba(0, 0, 0, 0.2),
        0 0 15px rgba(96, 165, 250, 0.1);
    border - color: rgba(96, 165, 250, 0.3);
}
    
    .lesson - card.completed {
    border - color: rgba(34, 197, 94, 0.4);
    background: linear - gradient(145deg, rgba(34, 197, 94, 0.05), rgba(30, 41, 59, 0.7));
}


    .quiz - lesson - btn {
    flex: 1;
    background: linear - gradient(135deg, #8b5cf6 0 %, #6d28d9 100 %);
    color: white;
    border: none;
    padding: 1rem;
    border - radius: 12px;
    font - weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box - shadow 0.2s;
    box - shadow: 0 4px 6px - 1px rgba(109, 40, 217, 0.3);
    display: flex;
    align - items: center;
    justify - content: center;
    gap: 8px;
}

    .quiz - lesson - btn:hover {
    transform: translateY(-2px);
    box - shadow: 0 10px 15px - 3px rgba(109, 40, 217, 0.4);
}

    .quiz - lesson - btn:active {
    transform: translateY(0);
}

    /* Mastery Stars */
    .mastery - stars {
    display: flex;
    gap: 4px;
    margin - top: 8px;
    justify - content: center;
}

    .star {
    font - size: 1.1rem;
    color: #475569;
    transition: color 0.3s, transform 0.3s;
}

    .star.active {
    color: #fbbf24;
    filter: drop - shadow(0 0 4px rgba(251, 191, 36, 0.5));
    animation: starPop 0.4s cubic - bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes starPop {
    50 % { transform: scale(1.4); }
}

    /* Neon Progress */
    .lesson - progress - bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border - radius: 4px;
    overflow: visible;
    margin - top: 12px;
    position: relative;
}
    
    .lesson - progress - fill {
    height: 100 %;
    background: #60a5fa;
    border - radius: 4px;
    transition: width 0.5s ease;
    position: relative;
    box - shadow: 0 0 10px rgba(96, 165, 250, 0.8);
}
    
    .lesson - card.completed.lesson - progress - fill {
    background: #22c55e;
    box - shadow: 0 0 10px rgba(34, 197, 94, 0.8);
}

    /* --- Search Result Style Layout --- */
    .lesson - card - header {
    display: flex;
    justify - content: space - between; /* Push checkmark to right */
    align - items: flex - start;
    margin - bottom: 1rem;
    width: 100 %; /* Ensure header takes full width */
}

    .lesson - text - group {
    display: flex;
    flex - direction: column;
    align - items: flex - start; /* Align Title and Badge to Left */
    gap: 0.5rem;
    flex: 1; /* Take available space */
    min - width: 0; /* Prevent overflow issues */
}

    .lesson - title.search - result - title {
    font - size: 1.3rem;
    font - weight: 700;
    color: #f8fafc;
    margin: 0;
    line - height: 1.2;
    width: 100 %;
    white - space: nowrap;       /* Keep text on one line */
    overflow: hidden;          /* Hide overflow */
    text - overflow: ellipsis;   /* Add ... if too long */
    text - align: left;          /* Force left alignment */
}

    .quiz - stats - row {
    display: flex;
    justify - content: space - between;
    align - items: center;
    padding: 0 0.5rem;
    margin - top: 0.5rem;
    font - size: 0.9rem;
    color: #94a3b8;
}

    .quiz - stat - item {
    display: flex;
    align - items: center;
    gap: 6px;
    background: rgba(15, 23, 42, 0.4);
    padding: 6px 12px;
    border - radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

    .streak - container {
    color: #64748b;
    transition: color 0.3s, transform 0.3s;
}

    .streak - container.active {
    color: #f59e0b; /* Amber 500 */
    border - color: rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.1);
    font - weight: bold;
    box - shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}
font - weight: 700;
color: #f8fafc;
margin: 0;
line - height: 1.2;
width: 100 %;
white - space: nowrap;       /* Keep text on one line */
overflow: hidden;          /* Hide overflow */
text - overflow: ellipsis;   /* Add ... if too long */
text - align: left;          /* Force left alignment */
    }

    .lesson - level - badge {
    font - size: 0.75rem;
    padding: 2px 8px;
    border - radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    width: fit - content;
    display: inline - flex;
    align - items: center;
    gap: 4px;
    text - transform: capitalize;
}

    .lesson - subtitle - arb {
    color: #94a3b8;
    font - size: 0.95rem;
    margin - bottom: 1rem;
    font - family: 'Tajawal', sans - serif;
}

    .lesson - meta - row {
    display: flex;
    gap: 1rem;
    margin - bottom: 1rem;
}

    .meta - item {
    display: flex;
    align - items: center;
    gap: 6px;
    color: #64748b;
    font - size: 0.85rem;
    background: rgba(15, 23, 42, 0.4);
    padding: 4px 10px;
    border - radius: 8px;
}
    
    .meta - item.icon {
    opacity: 0.8;
}

    .check - icon {
    color: #4ade80;
    font - weight: bold;
    background: rgba(74, 222, 128, 0.1);
    width: 28px;
    height: 28px;
    display: flex;
    align - items: center;
    justify - content: center;
    border - radius: 50 %;
}

    /* Lesson Modal Styles */
    .lesson - sections {
    padding - bottom: 2rem;
}
    
    .lesson - section {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border - radius: 16px;
    padding: 1.5rem;
    margin - bottom: 1.5rem;
}
    
    .section - title {
    color: #60a5fa;
    font - size: 1.2rem;
    margin - bottom: 1rem;
}
    
    .content - item {
    color: #e2e8f0;
    line - height: 1.8;
    margin - bottom: 1rem;
}
    
    .examples - list {
    display: flex;
    flex - direction: column;
    gap: 0.8rem;
}
    
    .example - item {
    background: rgba(15, 23, 42, 0.6);
    border - radius: 12px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
}
    
    .example - swe {
    color: #e2e8f0;
    display: flex;
    align - items: center;
    gap: 0.5rem;
    margin - bottom: 0.5rem;
}

    .example - actions - row {
    display: flex;
    justify - content: space - between;
    align - items: center;
    gap: 0.5rem;
}

    /* Matching .action-btn-premium style */
    .train - mini - btn {
    width: 44px;
    height: 44px;
    background: linear - gradient(135deg, #1e3a8a 0 %, #0ea5e9 100 %);
    color: white;
    border: none;
    border - radius: 12px;
    cursor: pointer;
    display: flex;
    align - items: center;
    justify - content: center;
    font - size: 1.2rem;
    transition: all 0.3s cubic - bezier(0.4, 0, 0.2, 1);
    flex - shrink: 0;
    box - shadow: 0 4px 10px rgba(0, 91, 150, 0.3);
    position: relative;
    overflow: hidden;
}

    .train - mini - btn::before {
    content: '';
    position: absolute;
    top: 50 %;
    left: 50 %;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border - radius: 50 %;
    transform: translate(-50 %, -50 %);
    transition: width 0.4s, height 0.4s;
}

    .train - mini - btn:hover {
    transform: translateY(-2px);
    box - shadow: 0 8px 15px rgba(0, 91, 150, 0.4);
}

    .train - mini - btn: hover::before {
    width: 100px;
    height: 100px;
}

    .train - mini - btn.active {
    background: linear - gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    border: 1px solid rgba(255, 255, 255, 0.2);
    box - shadow: none;
    color: #94a3b8;
}
    
    .example - arb {
    color: #94a3b8;
    direction: rtl;
    text - align: right;
    font - size: 0.9rem;
}
    
    .speak - btn {
    background: none;
    border: none;
    cursor: pointer;
    font - size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
}
    
    .speak - btn:hover {
    opacity: 1;
}
    
    .show - more - btn {
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.3);
    color: #60a5fa;
    padding: 0.8rem;
    border - radius: 12px;
    cursor: pointer;
    width: 100 %;
    font - size: 0.9rem;
    transition: all 0.3s;
}
    
    .show - more - btn:hover {
    background: rgba(96, 165, 250, 0.3);
}
    
    .more - examples {
    display: none;
}
    
    .examples - list.expanded.more - examples {
    display: flex;
    flex - direction: column;
    gap: 0.8rem;
}
    
    .complete - lesson - btn {
    background: linear - gradient(135deg, #22c55e, #16a34a);
    border: none;
    color: white;
    padding: 1rem 2rem;
    border - radius: 16px;
    font - size: 1rem;
    cursor: pointer;
    width: 100 %;
    margin - top: 1rem;
    transition: all 0.3s;
}
    
    .complete - lesson - btn:hover {
    transform: translateY(-2px);
    box - shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
}
    
    .lesson - actions {
    margin - top: 2rem;
}

@keyframes levelUp {
    0 % { transform: scale(1); }
    50 % { transform: scale(1.3); }
    100 % { transform: scale(1); }
}

    /* --- Mode selection bar --- */
    .mode - selection - bar {
    display: flex;
    background: rgba(15, 23, 42, 0.6);
    backdrop - filter: blur(10px);
    -webkit - backdrop - filter: blur(10px);
    margin: 1rem;
    padding: 4px;
    border - radius: 20px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.05);
    z - index: 10;
}

    .mode - btn {
    flex: 1;
    background: none;
    border: none;
    padding: 0.8rem 0.5rem;
    border - radius: 16px;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    flex - direction: column;
    align - items: center;
    gap: 4px;
    position: relative;
    z - index: 2;
    transition: color 0.3s;
}

    .mode - btn.active {
    color: #fbbf24;
}

    .mode - icon {
    font - size: 1.2rem;
}

    .mode - label {
    font - size: 0.7rem;
    font - weight: 600;
    text - transform: uppercase;
    letter - spacing: 0.5px;
}

    .mode - indicator {
    position: absolute;
    bottom: 4px;
    top: 4px;
    background: linear - gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05));
    border: 1px solid rgba(251, 191, 36, 0.3);
    border - radius: 16px;
    transition: all 0.4s cubic - bezier(0.175, 0.885, 0.32, 1.275);
    z - index: 1;
}

    /* --- View Sections --- */
    .view - section {
    display: none;
}
    .view - section.active {
    display: block;
    animation: viewIn 0.5s cubic - bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes viewIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
}

    /* --- Quiz Styles --- */
    .quiz - container {
    padding: 1rem;
    max - width: 600px;
    margin: 0 auto;
}
    .quiz - progress - bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border - radius: 10px;
    overflow: hidden;
    margin - bottom: 0.5rem;
}
    .quiz - progress - fill {
    height: 100 %;
    background: linear - gradient(90deg, #fbbf24, #f59e0b);
    border - radius: 10px;
    transition: width 0.4s ease;
    box - shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}
    .quiz - stats {
    display: flex;
    justify - content: space - between;
    color: #94a3b8;
    font - size: 0.85rem;
    margin - bottom: 2rem;
}
    .question - card {
    background: rgba(30, 41, 59, 0.7);
    backdrop - filter: blur(12px);
    -webkit - backdrop - filter: blur(12px);
    border - radius: 28px;
    padding: 3rem 2rem;
    text - align: center;
    margin - bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box - shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}
    .question - label {
    color: #60a5fa;
    font - size: 0.9rem;
    text - transform: uppercase;
    letter - spacing: 2px;
    margin - bottom: 1.5rem;
    opacity: 0.8;
}
    .question - text {
    font - size: 2rem;
    font - weight: 800;
    color: #f8fafc;
    line - height: 1.4;
}
    .question - card {
    padding: 1rem;
    margin - bottom: 1rem;
}
    .question - text { margin - bottom: 1rem; }
    
    .options - grid {
    display: grid;
    grid - template - columns: 1fr;
    gap: 0.8rem;
}
    .option - btn {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border - radius: 16px;
    color: #e2e8f0;
    font - size: 1.1rem;
    font - weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic - bezier(0.175, 0.885, 0.32, 1.275);
    box - shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
    .option - btn: hover: not(: disabled) {
    transform: translateY(-3px);
    background: rgba(96, 165, 250, 0.1);
    border - color: #60a5fa;
    box - shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
}
    .option - btn: active: not(: disabled) { transform: scale(0.95); }
    .option - btn.correct {
    background: rgba(34, 197, 94, 0.2)!important;
    border - color: #22c55e!important;
    color: #4ade80!important;
    box - shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}
    .option - btn.wrong {
    background: rgba(239, 68, 68, 0.2)!important;
    border - color: #ef4444!important;
    color: #f87171!important;
    box - shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

    /* --- Flashcard Styles --- */
    .flashcard - container {
    padding: 1rem;
    max - width: 500px;
    margin: 0 auto;
}
    .flashcard - header {
    display: flex;
    align - items: center;
    gap: 1rem;
    margin - bottom: 1.5rem;
}
    .flashcard - wrapper {
    perspective: 1200px;
    height: 340px;
    width: 100 %;
    margin - bottom: 1.5rem;
    cursor: pointer;
}
    .flashcard - inner {
    position: relative;
    width: 100 %;
    height: 100 %;
    text - align: center;
    transition: transform 0.8s cubic - bezier(0.4, 0, 0.2, 1);
    transform - style: preserve - 3d;
}
    .flashcard - wrapper.flipped.flashcard - inner {
    transform: rotateY(180deg);
}
    .flashcard - front, .flashcard - back {
    position: absolute;
    width: 100 %;
    height: 100 %;
    backface - visibility: hidden;
    display: flex;
    flex - direction: column;
    align - items: center;
    justify - content: center;
    background: linear - gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
    backdrop - filter: blur(20px);
    -webkit - backdrop - filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border - radius: 32px;
    padding: 1.5rem;
    box - shadow:
    0 20px 40px - 10px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
    .flashcard - front::after {
    content: '';
    position: absolute;
    inset: 0;
    border - radius: 32px;
    padding: 1px;
    background: linear - gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    -webkit - mask: linear - gradient(#fff 0 0) content - box, linear - gradient(#fff 0 0);
    -webkit - mask - composite: xor;
    mask - composite: exclude;
    pointer - events: none;
}
    .flashcard - back {
    transform: rotateY(180deg);
    border - color: rgba(96, 165, 250, 0.2);
}
    .flashcard - label {
    display: none;
}
    .flashcard - text {
    font - size: 2.5rem;
    font - weight: 800;
    color: #f8fafc;
    line - height: 1.2;
    text - shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    margin - bottom: 0.5rem;
}
    .flashcard - example {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem 1.25rem;
    border - radius: 16px;
    margin - top: 1rem;
    font - size: 1rem;
    color: #cbd5e1;
    font - style: italic;
    border: 1px solid rgba(255, 255, 255, 0.05);
    max - width: 90 %;
    line - height: 1.6;
}
    .flashcard - hint {
    font - size: 0.8rem;
    color: #64748b;
    margin - top: 1rem;
    font - style: italic;
}
    .flashcard - controls {
    display: flex;
    gap: 1.5rem;
}
    .flashcard - controls button {
    flex: 1;
    padding: 1.2rem;
    border - radius: 20px;
    border: none;
    font - weight: 700;
    font - size: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic - bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align - items: center;
    justify - content: center;
    gap: 0.8rem;
}
    .flashcard - controls button:hover { transform: translateY(-3px); }
    .flashcard - controls button:active { transform: scale(0.95); }
    
    .dont - know - btn {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.25)!important;
    box - shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
}
    .know - btn {
    background: linear - gradient(135deg, #fbbf24, #d97706);
    color: #1e293b;
    border: none!important;
    box - shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
}
    .know - btn:hover {
    transform: translateY(-2px);
    box - shadow: 0 12px 25px rgba(251, 191, 36, 0.4);
}
    
    .flashcard - counter {
    text - align: right;
    margin: 0;
    color: #94a3b8;
    font - size: 1rem;
    font - weight: 600;
    white - space: nowrap;
    min - width: fit - content;
}

    /* Results */
    .quiz - results {
    text - align: center;
    padding: 3rem 2rem;
    background: rgba(30, 41, 59, 0.5);
    border - radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
    .result - icon { font - size: 5rem; margin - bottom: 1.5rem; filter: drop - shadow(0 0 15px rgba(251, 191, 36, 0.3)); }
    .result - score { font - size: 4rem; font - weight: 900; color: #fbbf24; margin: 1.5rem 0; }
    .result - actions { display: flex; flex - direction: column; gap: 1.2rem; margin - top: 3rem; }
    .primary - btn {
    background: linear - gradient(135deg, #fbbf24, #f59e0b);
    color: #1e293b;
    padding: 1.3rem;
    border - radius: 20px;
    border: none;
    font - weight: 800;
    font - size: 1.1rem;
    cursor: pointer;
    box - shadow: 0 10px 20px rgba(251, 191, 36, 0.2);
}
    .secondary - btn {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
    padding: 1.3rem;
    border - radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font - weight: 700;
    font - size: 1rem;
    cursor: pointer;
}

    /* Saved List */
    .saved - container { padding: 1rem; }
    .saved - list { display: grid; gap: 1rem; }

    /* Empty State */
    .empty - state {
    text - align: center;
    padding: 5rem 2rem;
    color: #64748b;
    background: rgba(30, 41, 59, 0.3);
    border - radius: 24px;
    margin: 2rem 0;
}
    .empty - state p { margin - bottom: 1rem; font - size: 1.1rem; }
    .retry - btn {
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.3);
    padding: 0.8rem 1.5rem;
    border - radius: 12px;
    cursor: pointer;
    font - weight: 600;
}

@media(max - width: 600px) {
        .options - grid { grid - template - columns: 1fr; }
        .question - text { font - size: 1.6rem; }
        .flashcard - text { font - size: 1.8rem; }
        .flashcard - wrapper { height: 350px; }
}

    .flashcard - example {
    font - size: 1.1rem;
    margin - top: 1.5rem;
    opacity: 0.9;
    font - style: italic;
    padding: 0 1rem;
    line - height: 1.6;
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.8rem;
    border - radius: 12px;
    width: 100 %;
}
`;document.head.appendChild(he);typeof window<"u"&&document.addEventListener("DOMContentLoaded",()=>{Se.init(),aa()});
