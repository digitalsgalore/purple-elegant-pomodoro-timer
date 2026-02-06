(() => {
  const MODES = {
    pomodoro: { minutes: 25, class: 'mode-pomodoro' },
    short: { minutes: 5, class: 'mode-short' },
    long: { minutes: 10, class: 'mode-long' }
  };

  const widget = document.getElementById('widget');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const timerDisplay = document.getElementById('timer-display');
  const alarm = document.getElementById('alarm-audio');

  let currentMode = 'pomodoro';
  let remaining = MODES.pomodoro.minutes * 60;
  let running = false;
  let intervalId = null;

  // Load from localStorage if present
  function loadState(){
    try{
      const raw = localStorage.getItem('pomodoro_state');
      if(!raw) return;
      const s = JSON.parse(raw);
      if(s.mode && MODES[s.mode]) currentMode = s.mode;
      if(typeof s.remaining === 'number') remaining = s.remaining;
      if(typeof s.running === 'boolean') running = s.running;
    }catch(e){ console.warn('Failed to load state', e); }
  }

  function saveState(){
    const s = { mode: currentMode, remaining, running };
    try{ localStorage.setItem('pomodoro_state', JSON.stringify(s)); }catch(e){ /* ignore */ }
  }

  function setMode(mode){
    if(!MODES[mode]) return;
    currentMode = mode;
    remaining = MODES[mode].minutes * 60;
    // update widget background class (kept for compatibility)
    widget.classList.remove('mode-pomodoro','mode-short','mode-long');
    widget.classList.add(MODES[mode].class);
    // show/hide explicit bg <img> layers so images are beneath controls
    const bgPom = document.getElementById('bg-pomodoro');
    const bgShort = document.getElementById('bg-short');
    const bgLong = document.getElementById('bg-long');
    if(bgPom && bgShort && bgLong){
      bgPom.style.display = mode === 'pomodoro' ? 'block' : 'none';
      bgShort.style.display = mode === 'short' ? 'block' : 'none';
      bgLong.style.display = mode === 'long' ? 'block' : 'none';
    }
    updateDisplay();
    saveState();
  }

  function formatTime(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function updateDisplay(){
    timerDisplay.textContent = formatTime(remaining);
  }

  function tick(){
    if(remaining <= 0){
      stopTimer();
      playAlarm();
      return;
    }
    remaining -= 1;
    updateDisplay();
    saveState();
  }

  function startTimer(){
    if(running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
    saveState();
  }

  function stopTimer(){
    running = false;
    if(intervalId){ clearInterval(intervalId); intervalId = null; }
    saveState();
  }

  function updateStartButtonText(){
    if(!startBtn) return;
    startBtn.textContent = running ? 'STOP' : 'START';
  }

  function resetTimer(){
    stopTimer();
    remaining = MODES[currentMode].minutes * 60;
    updateDisplay();
    alarm.pause();
    alarm.currentTime = 0;
    saveState();
    updateStartButtonText();
  }

  function playAlarm(){
    try{
      alarm.currentTime = 0;
      alarm.play();
      // stop running state only after audio ends
      alarm.onended = () => { stopTimer(); updateStartButtonText(); };
    }catch(e){ console.warn('Cannot play alarm', e); }
  }

  // add event listeners for mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const m = btn.dataset.mode;
      setMode(m);
    });
  });

  startBtn.addEventListener('click', ()=>{
    if(!running){ startTimer(); } else { stopTimer(); }
    // toggle visual state saved
    saveState();
    updateStartButtonText();
  });

  resetBtn.addEventListener('click', ()=>{
    resetTimer();
  });

  // initialize
  loadState();
  // ensure widget reflect background and show the correct bg image layer
  widget.classList.remove('mode-pomodoro','mode-short','mode-long');
  widget.classList.add(MODES[currentMode].class);
  setMode(currentMode);
  updateDisplay();

  // if the loaded state had running=true, resume countdown
  if(running){ startTimer(); }
  updateStartButtonText();

  // save state on unload
  window.addEventListener('beforeunload', saveState);

})();
