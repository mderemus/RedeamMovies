<template>
	<div class="p-grid crud-demo">
		<div class="p-col-12">
			<div class="card">
				<Toast/>
				<Toolbar class="p-mb-4">
					<template v-slot:left>
						<Button label="New" icon="pi pi-plus" class="p-button-success p-mr-2" @click="openNew" />
						<Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedMovies || !selectedMovies.length" />
					</template>

					<template v-slot:right>
						<Button label="Export" icon="pi pi-upload" class="p-button-help" @click="exportCSV($event)"  />
					</template>
				</Toolbar>

				<DataTable 
					ref="dt" 
					:value="filteredMovies" 
					v-model:selection="selectedMovies" 
					dataKey="id" 
					:paginator="true" 
					:rows="10"
					v-model:filters="filters" 
					:globalFilterFields="['title','description']"
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" 
					:rowsPerPageOptions="[5,10,25]"
					currentPageReportTemplate="Showing {first} to {last} of {totalRecords} movies" 
					responsiveLayout="scroll">
					<template #header>
						<div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
							<h5 class="p-m-0">Manage Movies</h5>
							<span class="p-input">
									<label for="dateFilterType">Filter Movie Table by Date: </label>
									<select v-model="dateFilterType" style="margin-right:5px;" @change="checkDateFilterType">
										<option value="">--Select--</option>
										<option>Before</option>
										<option>After</option>
										<option>On</option>
									</select>
									<span v-if="dateFilterType != ''">
										<Calendar :monthNavigator="true" :yearNavigator="true" 
											dateFormat="mm/dd/yy"  
											yearRange="1950:2050" 
											:showIcon="true" 
											:showButtonBar="true" 
											v-model="searchDate">
										</Calendar>
										<Button label="Refresh" icon="pi pi-search" class="p-button-rounded p-button-success p-mr-2" style="margin-left:5px;" @click="filterGridByDateAndType" />
									</span>
							</span>
							<span class="p-input-icon-left">
									<i class="pi pi-search" />
									<InputText v-model="filters['global'].value" placeholder="Quick Search..." />
							</span>
						</div>
					</template>

					<Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
					<Column field="id" header="Id" :sortable="true">
						<template #body="slotProps">
							<span class="p-column-title">Id</span>
							{{slotProps.data.id}}
						</template>
					</Column>
					<Column field="title" header="Title" :sortable="true" filterField="title">
						<template #body="slotProps">
							<span class="p-column-title">Title</span>
							{{slotProps.data.title}}
						</template>
					</Column>
					<Column field="description" header="Description" filterField="description" :sortable="true">
						<template #body="slotProps">
							<span class="p-column-title">Description</span>
							{{slotProps.data.description}}
						</template>
					</Column>
					<Column field="releaseDate" header="Release Date" :sortable="true">
						<template #body="slotProps">
							<span class="p-column-title">Release Date</span>
							{{formatDate(slotProps.data.releaseDate)}}
						</template>
					</Column>

					<Column>
						<template #body="slotProps">
							<Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-mr-2" @click="editMovie(slotProps.data)" />
							<Button icon="pi pi-trash" class="p-button-rounded p-button-warning" @click="confirmDeleteMovie(slotProps.data)" />
						</template>
					</Column>
				</DataTable>

				<Dialog v-model:visible="movieDialog" :style="{width: '450px'}" header="Video Details" :modal="true" class="p-fluid">
					<div class="p-field">
						<label for="title">Title</label>
						<InputText id="title" v-model.trim="movie.title" required="true" autofocus :class="{'p-invalid': submitted && !movie.title}" />
						<small class="p-invalid" v-if="submitted && !movie.title">Title is required.</small>
					</div>
					<div class="p-field">
						<label for="description">Description</label>
						<Textarea id="description" v-model="movie.description" required="true" rows="3" cols="20" />
					</div>
					<div class="p-field">
						<label for="releaseDate">Release Date</label>
						<Calendar id="releaseDate" :monthNavigator="true" :yearNavigator="true" 
							dateFormat="mm/dd/yy"  
							yearRange="1950:2050" 
							:showIcon="true" 
							:showButtonBar="true" 
							v-model="movie.releaseDate">
						</Calendar>
					</div>

					<template #footer>
						<Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog"/>
						<Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveMovie" />
					</template>
				</Dialog>

				<Dialog v-model:visible="deleteMovieDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
					<div class="confirmation-content">
						<i class="pi pi-exclamation-triangle p-mr-3" style="font-size: 2rem" />
						<span v-if="movie">Are you sure you want to delete <b>{{movie.title}}</b>?</span>
					</div>
					<template #footer>
						<Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteMovieDialog = false"/>
						<Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteMovie" />
					</template>
				</Dialog>

				<Dialog v-model:visible="deleteMoviesDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
					<div class="confirmation-content">
						<i class="pi pi-exclamation-triangle p-mr-3" style="font-size: 2rem" />
						<span v-if="movie">Are you sure you want to delete the selected movies?</span>
					</div>
					<template #footer>
						<Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteMoviesDialog = false"/>
						<Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedMovies" />
					</template>
				</Dialog>
			</div>
		</div>
	</div>

</template>

<script>
import MovieService from '../service/MovieService';
import moment from 'moment';
import {FilterMatchMode} from 'primevue/api';

export default {
	data() {
		return {
			movies: null,
			filteredMovies: null,
			movieDialog: false,
			deleteMovieDialog: false,
			deleteMoviesDialog: false,
			movie: {},
			selectedMovies: null,
			searchDate:null,
			dateFilterType: '',
			filters: {
				'global': {value: null, matchMode: FilterMatchMode.CONTAINS}
			},
			submitted: false,
		}
	},
	movieService: null,
	created() {
		this.movieService = new MovieService();
	},
	mounted() {
		this.movieService.getMovies().then(data => this.filteredMovies = this.movies = data);
	},
	methods: {
		formatDate(value) {
			if(value)
				return moment(new Date(String(value))).format('MM/DD/YYYY')
			return;
		},
		openNew() {
			this.movie = {};
			this.submitted = false;
			this.movieDialog = true;
		},
		hideDialog() {
			this.movieDialog = false;
			this.submitted = false;
		},
		saveMovie() {
			this.submitted = true;
			if (this.movie.title.trim()) {
			if (this.movie.id) {
				this.filteredMovies[this.findIndexById(this.movie.id)] = this.movie;
				this.$toast.add({severity:'success', summary: 'Successful', detail: 'Movie Updated', life: 3000});
				}
				else {
					this.movie.id = this.createId();
					this.filteredMovies.push(this.movie);
					this.$toast.add({severity:'success', summary: 'Successful', detail: 'Movie Created', life: 3000});
				}
				this.movieDialog = false;
				this.movie = {};
			}
		},
		editMovie(movie) {
			this.movie = {...movie};
			this.movieDialog = true;
		},
		confirmDeleteMovie(movie) {
			this.movie = movie;
			this.deleteMovieDialog = true;
		},
		deleteMovie() {
			this.filteredMovies = this.filteredMovies.filter(val => val.id !== this.movie.id);
			this.deleteMovieDialog = false;
			this.movie = {};
			this.$toast.add({severity:'success', summary: 'Successful', detail: 'Movie Deleted', life: 3000});
		},
		findIndexById(id) {
			let index = -1;
			for (let i = 0; i < this.filteredMovies.length; i++) {
				if (this.filteredMovies[i].id === id) {
					index = i;
					break;
				}
			}
			return index;
		},
		createId() {
			let id = '';
			var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			for ( var i = 0; i < 5; i++ ) {
				id += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return id;
		},
		exportCSV() {
			this.$refs.dt.exportCSV();
		},
		confirmDeleteSelected() {
			this.deleteMoviesDialog = true;
		},
		deleteSelectedMovies() {
			this.filteredMovies = this.filteredMovies.filter(val => !this.selectedMovies.includes(val));
			this.deleteMoviesDialog = false;
			this.selectedMovies = null;
			this.$toast.add({severity:'success', summary: 'Successful', detail: 'Movies Deleted', life: 3000});
		},
		checkDateFilterType(){
			if (this.dateFilterType == ''){
				this.searchDate = null;
				this.filteredMovies = this.movies;
				return;
			} 
		},
		filterGridByDateAndType(){
			let dateFilter = this.formatDate(this.searchDate);
			let filterType = this.dateFilterType.toLowerCase();
			this.filteredMovies = this.movies.filter(val => { 
				var d1 = new Date(val.releaseDate).getTime() 
				var d2 = new Date(dateFilter).getTime();
				if (filterType === 'before')
					return ( d1 < d2 ) 
				if (filterType === 'after')
					return (d1 > d2) 	
				if (filterType === 'on')
					return (d1 === d2)
			}); 
		}
	}
}
</script>

<style scoped lang="scss">
	.table-header {
		display: flex;
		justify-content: space-between;
	}


	.p-dialog {
		width: 150px;
		margin: 0 auto 2rem auto;
		display: block;
	}

	.confirmation-content {
		display: flex;
		align-items: center;
		justify-content: center;
	}


	::v-deep(.p-toolbar) {
		flex-wrap: wrap;
		.p-button {
			margin-bottom: .25rem;
		}
	}
</style>
