// Use Tauri native dialog when available; otherwise fall back to a browser file input.
async function getOpenDialog() {
  // Attempt to dynamically import the Tauri API at runtime.
  try {
    // dynamic import prevents static bundlers from always resolving this dependency
    const mod = await import('@tauri-apps/api/dialog');
    return mod.open;
  } catch (e) {
    // Fallback: return a function that opens a hidden <input type="file"> and resolves with File objects
    return (opts = {}) => new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = !!opts.multiple;
      // Try to derive accept from filters if provided
      if (opts.filters && opts.filters.length && opts.filters[0].extensions) {
        input.accept = opts.filters[0].extensions.map(ext => '.' + ext).join(',');
      } else if (opts.accept) {
        input.accept = opts.accept;
      } else {
        input.accept = 'video/*';
      }
      input.style.display = 'none';
      input.onchange = e => {
        const files = Array.from(e.target.files || []);
        // Resolve with the File objects to match browser behavior
        resolve(files);
        input.remove();
      };
      document.body.appendChild(input);
      input.click();
    });
  }
}

const btnLoad = document.getElementById('btnLoad')
const btnSync = document.getElementById('btnSync')
const btnToggleCRT = document.getElementById('btnToggleCRT')
const btnFullscreen = document.getElementById('btnFullscreen')
const filmstrip = document.getElementById('filmstrip')
const mainScreen = document.getElementById('mainScreen')
const crt = document.getElementById('crt')
const pool = document.getElementById('playbackPool')
const staticOverlay = document.getElementById('staticOverlay')
const staticCanvas = document.getElementById('staticCanvas')

let videos = [], urls = [], pageStart = 0, selected = -1, firstInteraction = false
let gamepadEnabled = false
let gpPrev = {}
let noiseRAF = null

function toFileUrl(p){
  // Convert Windows backslashes to forward slashes and ensure file:///C:/path format
  if(!p) return p
  const normalized = p.replace(/\\/g, '/')
  if(/^[A-Za-z]:\//.test(normalized)) return 'file:///' + normalized
  return 'file://' + normalized
}

function makeVideo(src, label){
  const v = document.createElement('video')
  v.src = src
  v.loop = true
  v.preload = 'auto'
  v.playsInline = true
  v.muted = true
  v.controls = false
  v.style.width = '100%'
  v.style.height = '100%'
  v.style.objectFit = 'cover'
  v.dataset.label = label || ''
  return v
}

function renderFilmstrip(){
  filmstrip.innerHTML = ''
  if(videos.length === 0) return
  const count = Math.min(4, videos.length)
  for(let i=0;i<count;i++){
    const idx = (pageStart + i) % videos.length
    const cell = document.createElement('div')
    cell.className = 'thumb' + (idx===selected? ' active':'')
    const clone = videos[idx].cloneNode()
    clone.muted = true
    clone.playsInline = true
    clone.loop = true
    clone.preload = 'metadata'
    clone.play().catch(()=>{})
    cell.appendChild(clone)
    const lbl = document.createElement('div')
    lbl.className = 'label'
    lbl.textContent = (videos[idx].dataset.label || `Film ${idx+1}`) + (idx===selected? ' • LIVE':'' )
    cell.appendChild(lbl)
    cell.addEventListener('click',()=>selectIndex(idx))
    filmstrip.appendChild(cell)
  }
}

function mountSelected(){
  if(selected < 0 || !videos[selected]) return
  mainScreen.querySelectorAll('video').forEach(n=>{ n.muted = true; pool.appendChild(n) })
  const v = videos[selected]
  if(v.parentElement !== mainScreen) mainScreen.insertBefore(v, mainScreen.firstChild)
  v.muted = false; v.volume = 1.0
  v.play().catch(()=>{})
  videos.forEach((x,i)=>{ x.muted = (i!==selected) })
  renderFilmstrip()
}

function selectIndex(idx){
  if(videos.length===0) return
  if(idx<0) idx = videos.length-1
  if(idx>=videos.length) idx = 0
  selected = idx
  hideStatic()
  mountSelected()
}

function rotate(dir){ selectIndex(selected + dir) }

function page(dir){
  if(videos.length<=4) return
  pageStart = (pageStart + (dir*4) + videos.length) % videos.length
  renderFilmstrip()
}

function startAll(){
  videos.forEach(v=>{
    try{ v.currentTime = 0 }catch(_){ }
    if(v.parentElement !== pool) pool.appendChild(v)
    v.muted = true
    v.play().catch(()=>{})
  })
  if(selected<0) selected = 0
  mountSelected()
}

function hideStatic(){
  if(!firstInteraction){
    staticOverlay.style.display='none'
    if(noiseRAF) cancelAnimationFrame(noiseRAF)
    firstInteraction = true
  }
}

btnLoad.addEventListener('click', async ()=>{
  const openFn = await getOpenDialog();
  const result = await openFn({ multiple: true, filters: [{ name: 'Videos', extensions: ['mp4','mov','webm','mkv'] }], directory: false });
  if(!result) return;
  // Normalize to an array
  const arr = Array.isArray(result) ? result : [result];
  cleanup();
  arr.forEach(item => {
    let url, label;
    if (typeof item === 'string') {
      // Tauri returns filesystem paths
      url = toFileUrl(item);
      label = item.split(/[\\/]/).pop().replace(/\.[^/.]+$/, '');
    } else if (item instanceof File) {
      // Browser fallback returns File objects — create an object URL
      url = URL.createObjectURL(item);
      label = item.name.replace(/\.[^/.]+$/, '');
    } else {
      // Unknown type — try to stringify
      url = String(item);
      label = url.split('/').pop();
    }
    urls.push(url);
    const v = makeVideo(url, label);
    pool.appendChild(v);
    videos.push(v);
  });
  pageStart = 0; selected = -1; firstInteraction = false;
  staticOverlay.style.display = 'block';
  drawNoise();
  renderFilmstrip();
});

btnSync.addEventListener('click', ()=>{ startAll(); hideStatic() })
btnToggleCRT.addEventListener('click', ()=> crt.classList.toggle('crtOn'))

// Fullscreen support
function toggleFullScreen(){
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{})
  else (mainScreen.requestFullscreen ? mainScreen : mainScreen.parentElement).requestFullscreen().catch(()=>{})
}
btnFullscreen.addEventListener('click', ()=> toggleFullScreen())
window.addEventListener('keydown', e=>{ if(e.key==='f' || e.key==='F'){ e.preventDefault(); toggleFullScreen(); hideStatic(); }})

window.addEventListener('keydown', e=>{
  if(videos.length===0) return
  const key = e.key
  if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','1','2','3','4','m','M','g','G'].includes(key)) e.preventDefault()
  if(key==='ArrowRight') rotate(1)
  if(key==='ArrowLeft') rotate(-1)
  if(key==='ArrowUp') page(-1)
  if(key==='ArrowDown') page(1)
  if(['1','2','3','4'].includes(key)){
    const idx = (pageStart + (parseInt(key,10)-1)) % videos.length
    selectIndex(idx)
  }
  if(key==='m' || key==='M') videos.forEach((v,i)=> v.muted = (i!==selected))
  if(key==='g' || key==='G') gamepadEnabled = !gamepadEnabled
  hideStatic()
})

function drawNoise(){
  staticOverlay.style.display='block'
  const ctx = staticCanvas.getContext('2d')
  const resize = ()=>{ staticCanvas.width = staticOverlay.clientWidth; staticCanvas.height = staticOverlay.clientHeight }
  resize()
  const loop = ()=>{
    const w = staticCanvas.width, h = staticCanvas.height
    const img = ctx.createImageData(w,h)
    const data = img.data
    for(let i=0;i<data.length;i+=4){
      const n = Math.random()*255|0
      data[i]=data[i+1]=data[i+2]=n; data[i+3]=255
    }
    ctx.putImageData(img,0,0)
    noiseRAF = requestAnimationFrame(loop)
  }
  loop()
  window.addEventListener('resize', resize)
}

function cleanup(){
  videos.forEach(v=>{ try{ v.pause() }catch(_){ } })
  urls.forEach(u=>{})
  videos = []
  urls = []
  mainScreen.querySelectorAll('video').forEach(n=>n.remove())
  filmstrip.innerHTML = ''
}

drawNoise()

// Gamepad polling omitted for brevity; can be re-added later
