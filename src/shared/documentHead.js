function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function addLink(attrs) {
  const el = document.createElement('link');
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

export function applyDocumentHead({ title, icon, names = {}, properties = {}, links = [] }) {
  document.title = title;
  addLink({ rel: 'icon', type: 'image/png', href: icon });
  Object.entries(names).forEach(([key, content]) => setMeta('name', key, content));
  Object.entries(properties).forEach(([key, content]) => setMeta('property', key, content));
  links.forEach(addLink);
}
