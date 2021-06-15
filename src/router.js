import { createRouter, createWebHashHistory } from 'vue-router';
import Movies from './components/Movies.vue';

const routes = [
    {
        path: '/',
        name: 'movies',
        component: Movies,
    }
];

const router = createRouter({
    history: createWebHashHistory('/movies'),
    routes,
});

export default router;
