export default {
  methods: {
    shortenLength: function(string) {
      if ( string ) {
        string = DOMPurify.sanitize( string.trimAll() );
        const lengthInSeconds = this.timeStringToSeconds(string);
        return this.secondsToTimeString(lengthInSeconds, true);
      }
    },

    getSummary: function(el) {
      el.removeAttribute("class");
      var children = el.querySelectorAll("*");
      $.each(children, function() {
        this.removeAttribute("class");
      });

      return DOMPurify.sanitize(el.outerHTML.trimAll());
    },

    fixDates: function( source, overrideFormat ) {
      
      if ( source ) {
        
        var date = (typeof source === 'object') ? DOMPurify.sanitize( source.textContent.trimToColon() ) : DOMPurify.sanitize( source );
        const domainExtension = this.domainExtension;

        const regionalDateFormats = {
          ".com":    ["m-d-y", "MM-dd-yyyy"],
          ".ca":     ["y-m-d", "yyyy-MM-dd"],
          ".co.uk":  ["d-m-y", "dd-MM-yyyy"],
          ".de":     ["d-m-y", "dd-MM-yyyy"],
          ".fr":     ["d-m-y", "dd-MM-yyyy"],
          ".it":     ["d-m-y", "dd-MM-yyyy"],
          ".com.au": ["d-m-y", "dd-MM-yyyy"],
          ".in":     ["d-m-y", "dd-MM-yyyy"]
        };

        const formatString = overrideFormat || regionalDateFormats[domainExtension][0] || regionalDateFormats[".com"][0];
        const formatSplit = formatString.split("-");

        const newDate = {
          y: null,
          m: null,
          d: null
        };
        $.each(date.split("-"), function(i, date) {
          newDate[formatSplit[i]] = date;
        });
        date = null;
        // Some audible sites display all years in two digits,
        // which is very difficult to transform to 4 digits.
        // For example, if the year is 20, is it 1920, 2020, or 1420?
        // This conversion to 4 digits is not bulletproof, but better than nothing.
        if (newDate.y.length <= 2) {
          if (newDate.y >= 95 && newDate.y <= 99) {
            newDate.y = "19" + newDate.y;
          } else if (newDate.y < 95) {
            newDate.y = "20" + newDate.y;
          }
        }
        const ISO8601 = [newDate.y, newDate.m, newDate.d];
        // const originalFormat = regionalDateFormats[domainExtension][1] || regionalDateFormats['.com'][1];

        // This was just an idea to be a bit more flexible with how it shows up in the gallery, but it's not so simple
        // What if the person viewing it is not from the same country? The only proper way to do it I feel would be to
        // Show visitors whatever format is dominant in their country... but that seems too much work, so: "year-month-day" it is for now at least
        // return {
        //   value: dateFns.format(new Date(ISO8601[0], ISO8601[1] - 1, ISO8601[2]), 'yyyy-MM-dd'),
        //   original: dateFns.format(new Date(ISO8601[0], ISO8601[1] - 1, ISO8601[2]), originalFormat),
        // };
        return dateFormat( new Date(ISO8601[0], ISO8601[1] - 1, ISO8601[2]), "yyyy-MM-dd");
        
      } else {
        return null;
      }
    },

    getSeries: function(element, reverse) {
      const series = [];
      if (element) {
        const html = DOMPurify.sanitize( $(element).html() );
        var string = html.trimAll().trimToColon();
        string = $.parseHTML(string);
        
        
        $.each(string, function(index, object) {
          var string = object.textContent.trim().replace(/^,/, "").trimAll() || "";

          var titleRow = (index + 1) % 2;
          var numberRow = !titleRow;
          if (titleRow) {
            
            const url = object.href.split("?")[0].replace(window.location.origin, "");
            series.push({
              name: string,
              // url: url, // Url formed using the asin instead to minimize data size
              asin: reverse ? url.substring(url.lastIndexOf("asin=") + 1) : url.substring(url.lastIndexOf("/") + 1),
            });
            
          } else if (numberRow) {
            if ( string.match(/\d/) ) {
              // Trims text from the front: ("Book ", removes trailing comma, and splits numbers separated by commas
              var numbers = string.replace(/^[^0-9]*/, "").replace(/,$/, "").replace(/;$/, "").trim().split(",");
              // Numbers are added to the previous item
              var lastItem = series[series.length - 1];
              lastItem.bookNumbers = $.map(numbers, function(n) {
                return "" + n; // Every number is handled as a string to avoid issues with book ranges
              });
            }
          }
        });
      }
      return series.length > 0 ? (reverse ? series.reverse() : series) : null;
    },

    getArray: function(elements) {
      const objArray = [];
      $(elements).each(function() {
        const url = new Url( DOMPurify.sanitize( $(this).attr("href") ), true);
        var searchNarrator;
        var searchProvider;
        if (url.query.searchNarrator) searchNarrator = url.query.searchNarrator;
        if (url.query.searchProvider) searchProvider = url.query.searchProvider;
        url.clearQuery();
        if (searchNarrator) url.query.searchNarrator = searchNarrator;
        if (searchProvider) url.query.searchProvider = searchProvider;
        searchNarrator = null;
        searchProvider = null;

        let obj = {
          name: DOMPurify.sanitize( $(this).text().trim() )
        };
        const minifiedUrl = minifyUrl(url.toString());
        if (minifiedUrl) obj.url = minifiedUrl;

        objArray.push(obj);
      });
      return objArray.length > 0 ? objArray : null;

      function minifyUrl(url) {
        if (url.match(/^\/cat\//) || url.match(/^\/author\//)) {
          // When the data is rendered the url is formed using the parent key + the asin
          return url.substring(url.lastIndexOf("/") + 1);
        } else if (
          url.match(/^\/search\?searchNarrator/) ||
          url.match(/^\/search\?searchProvider/)
        ) {
          return null; // When the data is rendered, the url is formed using the name prop
        } else {
          return url;
        }
      }
    },

    // Since the added date is no longer available in the Audible library or store pages,
    // I'm adding a prop called "added", which obviously isn't the same as the date it was added,
    // but can be sorted in the same fashion... given that the array is in that same order,
    // which it should be. Old at the bottom (low number), new at the top (high number).
    addedOrder: function(books) {
      let id = books.length + 1;
      _.each(books, function(book) {
        --id;
        book.added = id;
      });
    },

    makeFrenchFries: function(hotpotato) {
      hotpotato.extras = {
        "domain-extension": this.domainExtension
      };

      hotpotato.chunks = [];
      _.each(hotpotato, function(item, key) {
        if (key !== "chunks" && _.isArray(item)) {
          const chunks = _.chunk(item, 50);
          hotpotato.chunks.push(key);
          hotpotato[key + "-chunk-length"] = chunks.length;
          _.each(chunks, function(chunk, i) {
            hotpotato[key + "-chunk-" + i] = chunk;
          });
          delete hotpotato[key]; // The original array is not needed anymore
          
        }
      });
    },

    // It's vegan glue... Don't worry about it...
    glueFriesBackTogether: function(data) {
      if (data && _.isEmpty(data)) {
        return null;
      } else {
        _.each(data.chunks, function(chunkName) {
          const chunksLength = data[chunkName + "-chunk-length"];
          const chunkNumbers = _.range(0, chunksLength);
          data[chunkName] = [];
          _.each(chunkNumbers, function(n) {
            data[chunkName] = data[chunkName].concat(
              data[chunkName + "-chunk-" + n]
            );
            delete data[chunkName + "-chunk-" + n];
          });
          delete data[chunkName + "-chunk-length"];
        });
        delete data.chunks;
      }
    }
  }
};
