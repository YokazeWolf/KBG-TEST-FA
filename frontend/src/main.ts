import { createApp } from 'vue';
import App from './App.vue';

import { createPinia } from 'pinia';

// Quasar related
import { Notify, Quasar } from 'quasar';
import quasarLang from 'quasar/lang/en-US';
import quasarIconSet from 'quasar/icon-set/material-icons';

import 'quasar/src/css/index.sass';
import '@quasar/extras/material-icons/material-icons.css';



const app = createApp(App);

app.use(Quasar, {
  plugins: {Notify},
  lang: quasarLang,
  iconSet: quasarIconSet,
  config: {
    dark: true,
  },
});

app.use(createPinia());


app.mount('#app');
