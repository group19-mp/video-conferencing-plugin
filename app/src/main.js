import Vue from "vue"
import locale from "./lib/locale"
import en from "./locales/en.json"
import App from "./pwa-app.vue"
import { postUpdateToIframeParent, state } from "./state"

Vue.config.productionTip = false


Vue.mixin({
  data() {
    return {
      state,
    }
  },
  watch: {
    state: {
      handler: postUpdateToIframeParent,
      deep: true,
    },
  },
  methods: {
  },
})

Vue.use(locale, {
  locales: {
    en,
  },
})

new Vue({
  render: (h) => h(App),
}).$mount("#app")


