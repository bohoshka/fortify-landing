document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
});
const form = document.getElementById('waitlist');
if(form){
  form.addEventListener('submit', (e)=>{
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Sending…';
  });
}
