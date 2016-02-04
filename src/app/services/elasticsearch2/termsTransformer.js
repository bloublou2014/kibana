define([
  'angular',
  'lodash'
],
function (angular,_) {
  var signature = /^\{\"facets\":\{\"terms\":/;

  return {
    condition: function(config){
      return /\/_search$/.test(config.url) && signature.test(config.data);
    },

    request: function(config){
      var facetData = angular.fromJson(config.data);

      var aggregationsData = {
        aggs:{
            fquery:{
              filter: facetData.facets.terms.facet_filter.fquery,
              aggs: {
                terms: {
                  terms: {
                    field: facetData.facets.terms.terms.field,
                    size: facetData.facets.terms.terms.size,
                    min_doc_count: 1
                  }
                }
              }
          }
        },
        size: facetData.size
      };

      config.data = angular.toJson(aggregationsData);

      return config;
    },

    response: function(response){
      var data = response.data;

      data.facets = {
        terms: {
          _type: 'terms',
          missing: -1, // TODO: figure out where t get the info from
          total: data.aggregations.fquery.doc_count,
          other: data.aggregations.fquery.terms.sum_other_doc_count,
          terms: _.map(data.aggregations.fquery.terms.buckets, function(bucket){
            return {
              term: bucket.key,
              count: bucket.doc_count
            };
          })
        }
      };

      return response;
    }
  }
});
