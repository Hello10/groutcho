import{createContext as t,useState as e,useMemo as r,useEffect as n,useContext as o,createElement as c}from"react";import{Router as u}from"groutcho";import i from"prop-types";const s=t();function p({input:t,routes:o,redirects:c,web:i,onChange:s}){function p(t){h(t),i&&window.history.pushState({},"",t)}const[a,h]=e(function(){if(i){const{location:t}=window,{pathname:e,search:r}=t;return`${e}${r}`}return"/"}()),d=r(()=>{const e=new u({routes:o,redirects:c});return e.onChange(t=>{t!==a&&(p(t),s&&s(a))},t),e});n(()=>{if(!i)return()=>{};function t(){h(a)}return window.addEventListener("popstate",t),()=>{window.removeEventListener("popstate",t)}},[]);const f=d.match({...t,url:a});return f.redirect&&p(f.url),{match:f,router:d,url:a}}function a(){const t=o(s);return function(e){return t.go(e)}}function h({input:t,routes:e,redirects:r,children:n,web:o,onChange:u}){const{router:i,match:a}=p({input:t,routes:e,redirects:r,web:o,onChange:u});return c(s.Provider,{value:i},n({match:a}))}h.propTypes={input:i.object,routes:i.object,redirects:i.object,web:i.bool,children:i.func,onChange:i.func};export{h as RouterContainer,s as RouterContext,a as useGo,p as useRouter};
//# sourceMappingURL=index.modern.js.map