
import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import {
  get,
  map,
  filter,
  findIndex,
  find,
  each,
  isArray,
  assign,
} from "lodash";

export default new Vuex.Store({

  state: {
    // States that persist by reading and writing to localStorage
    sticky: {
      lightSwitch: 1,
      lightSwitchSetByUser: false,
      // sortValues: false,
      viewMode: 'grid',
      chunkLocation: 0,
      booksInSeriesToggle: false,
      exportSettingsGallery: null,
      exportSettingsCSVdataSources: null,
      exportSettingsCSVcompatibility: null,
      booksInSeriesAll: false,
      booksInSeriesFinished: true,
      booksInSeriesOpenInApp: true,
      subPageSource: 'books',
      bookDetailsCollapsedCover: false,
      bookDetailsCollapsedDetails: false,
      contextMenuReminder: true,
    },
    // States that don't persist
    searchMounted: false,
    searchCollection: [],
    mutatingCollection: [],
    collectionSource: null,
    pageCollection: null,
    route: null,
    routeParams: null,
    library: null,
    urlOrigin: null,
    searchQuery: "",
    standalone: null,
    displayMode: null,
    listRenderingOpts: null,
    windowWidth: window.innerWidth,
    showBackground: false,
    audioPlayerVisible: false,
    chunkCollection: [],
    chunkDistance: 40,
    viewRefresh: '',
    pageTitle: null,
    pageSubTitle: null,
    version: null,
    extractSettings: null,
    siteOnline: true,
    searchOptCloseGuard: false,
    bundlingGallery: false,
    bookDetails: {
      book: null,
      index: -1,
    },
    searchOptOpenHeight: null,
    devMode: _.get( process.env, 'NODE_ENV' ) !== 'production',
    lazyScroll: true,
    navHistory: {
      btnNavigation: false,
      forward: [],
      back: [],
    },
  },

  mutations: {

    fromLocalStorage: function(state) {
      const lsState = JSON.parse(localStorage.getItem("aleSettings"));
      if (lsState) _.merge( state.sticky, lsState );
    },

    prop(state, config) {

      let setValues = function (config) {
        config = config || {};
        if (config.key) {
          const newValue = config.freeze ? Object.freeze(config.value) : config.value;
          _.set(state, config.key, newValue);
        }
      };

      if (_.isArray(config)) {
        _.each(config, function(conf) {
          setValues(conf);
        });
      } else {
        setValues(config);
      }
    },

    buildStandaloneData: function(state, inputArray) {
      state.library = state.library || {};
      _.each(inputArray, function( item ) {
        state.library[item.key] = Object.freeze( item.value );
      });
    },

    stickyProp: function(state, o) {
      state.sticky[o.key] = o.value;
    },

    addListRenderingOpts: function(state, o) {

      if ( o.sortValues !== undefined ) {
        let sortValues = _.find( state.listRenderingOpts.sort, { key: 'sortValues' });
        if ( sortValues ) sortValues.active = o.sortValues;
      }

      if ( o.splice ) {
        state.listRenderingOpts[o.listName].splice(o.splice, 0, o.option);
      }
      else if ( o.unshift ) {
        state.listRenderingOpts[o.listName].unshift( o.option );
      }
      else {
        state.listRenderingOpts[o.listName].push( o.option );
      }

      if ( o.activate ) {
        if ( o.listName === 'sort' ) {
          const currentSorter = _.find( state.listRenderingOpts[o.listName], "current" );
          if ( currentSorter ) currentSorter.current = false;
          o.option.current = true;
        }
        else {
          const currentlyActive = _.find( state.listRenderingOpts[o.listName], "active" );
          currentlyActive.active = false;
          o.option.active = true;
        }
      }

    },

    updateListRenderingOpts: function(state, o) {

      let currentList = state.listRenderingOpts[o.listName];
      let currentItem = currentList[ (o.index === 0 || o.index) ? o.index : _.findIndex( currentList, { key: o.key })];

      if ( o.sortValues !== undefined ) {
        let sortValues = _.find( state.listRenderingOpts.sort, { key: 'sortValues' });
        if ( sortValues ) sortValues.active = o.sortValues;
      }

      // if ( o.group ) {
      //   let groupies = _.filter( currentList, { group: currentItem.group });
      //   _.each( groupies, function( groupie, index ) {
      //     groupie.active = false;
      //   });
      // }

      if ( o.active === false || o.active === true ) currentItem.active = o.active;
      
      if ( currentItem.type === 'filterExtras' ) {
        if ( o.range ) currentItem.range = o.range;
        if ( o.value ) currentItem.value = o.value;
      }

      // Changes the currently active sorter (in sort: active state controls the direction)
      if ( o.listName === "sort" && currentItem.type === 'sort' ) {
        const currentSorter = _.find( currentList, "current" );
        currentSorter.current = false;
        currentItem.current = true;
      }

    },


    resetFilters: function(state, o) {

      _.each( state.listRenderingOpts.filter, function( filter ) {
        filter.active = (filter.type === 'filter');
      });

    },

    chunkCollectionReset: function( state ) {
      state.chunkDistance = state.sticky.viewMode === 'grid' ? 52 : 80;
      state.sticky.chunkLocation = 0;
      state.chunkCollection = [];
    },

    chunkCollectionAdd: function( state, config ) {

      config = config || {};

      const searchIsActive = state.searchQuery.trim() !== "";
      const source = searchIsActive ? state.searchCollection : state.mutatingCollection;
      if ( source.length > 0 ) {
        const location = config.chunkDistance ? config.chunkDistance : parseFloat( state.sticky.chunkLocation );
        let sliceOfLife = config.chunkDistance ? source.slice( 0, location ) : source.slice( location, location+state.chunkDistance );
        if ( sliceOfLife.length > 0 ) {

          if ( config.chunkDistance ) {
            state.chunkCollection = sliceOfLife;
          }
          else {
            state.chunkCollection = state.chunkCollection.concat( sliceOfLife );
          }

          state.sticky.chunkLocation = location + state.chunkDistance;

        }
      }

    },
    
    navHistory: function( state, config ) {
      
      const direction = config.pushOnly ? config.key : (config.key === 'back' ? 'forward' : 'back');
      state.navHistory[ direction ].push( config.value );
      if ( !config.pushOnly ) {
        state.navHistory[ config.key ].pop;
        state.navHistory.btnNavigation = true;
      }
      
    },

  },

  getters: {
    sortValues: function( state ) {
      return _.find( state.listRenderingOpts.sort, { key: "sortValues" }).active;
    },
    sortBy: function( state ) {
      return _.find( state.listRenderingOpts.sort, 'current').key;
    },
    regularFilters: function( state ) {
      return _.filter( state.listRenderingOpts.filter, { type: 'filter' }).length > 0;
    },
    filterKeys: function( state ) {
      return _.map(_.filter( state.listRenderingOpts.filter, { type: 'filter', active: true }), function( o ) {
        return o.key;
      }).join(',');
    },
    filterKeysLength: function( state ) {
      return _.filter( state.listRenderingOpts.filter, { type: 'filter' }).length;
    },
    filterExtrasKeys: function( state ) {
      return _.map(_.filter( state.listRenderingOpts.filter, { type: 'filterExtras', active: true }), function( o ) {
        return o.key;
      }).join(',');
    },
    scopeKeys: function( state ) {
      return _.map(_.filter( state.listRenderingOpts.scope, 'active'), function( o ) {
        return o.key;
      }).join(',');
    },
    searchIsActive: function( state ) {
      return state.searchQuery.trim() !== "";
    },
    collectionSource: function( state ) {
      return state.searchQuery.trim() !== "" ? state.searchCollection : _.get(state, state.collectionSource);
    },
    collectionTotal: function( state ) {
      return _.get(state, state.collectionSource, []).length;
    },
    collection: function( state ) {
      const searchIsActive = state.searchQuery.trim() !== "";
      if ( searchIsActive ) {
        return state.searchCollection;
      }
      else {
        return state.mutatingCollection;
      }
    },
    saveStandaloneAfter: function( state ) {

      let extraSettings = _.get( state, 'extractSettings.extraSettings' );
      if ( extraSettings ) {
        let saveStandaloneAfter = _.find( extraSettings, { name: 'saveStandaloneAfter', value: true, deactivated: false });
        if ( saveStandaloneAfter ) return true;
      }

    },
  }

});
