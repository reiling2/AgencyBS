function showFatalRenderError(err){
console.error(err);
const root=document.querySelector('.view.active') || document.getElementById('view-projects') || document.body;
const msg=(err && (err.stack || err.message)) ? String(err.stack || err.message) : String(err);
root.innerHTML='<div class="mobile-safe-error"><b>Сайт не смог отрисоваться.</b><br>Ошибка: '+esc(msg).slice(0,1200)+'<br><br>Попробуйте открыть файл через Safari/Chrome, а не через предпросмотр файла.</div>';
}
try{
renderAll();
}catch(err){
showFatalRenderError(err);
}
