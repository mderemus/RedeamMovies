import axios from 'axios';

export default class MovieService {

  

	getMovies() {
		return axios.get('assets/layout/data/movies.json').then(res => res.data.data);
    }


}
