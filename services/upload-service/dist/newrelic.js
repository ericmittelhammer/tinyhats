'use strict';
/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */

exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Upload Service'],

  /**
   * Your New Relic license key.
   */
  //license_key: 'license key here',

  /**
   * This setting controls distributed tracing.
   * Distributed tracing lets you see the path that a request takes through your
   * distributed system. Enabling distributed tracing changes the behavior of some
   * New Relic features, so carefully consult the transition guide before you enable
   * this feature: https://docs.newrelic.com/docs/transition-guide-distributed-tracing
   * Default is false.
   */
  distributed_tracing: {
    /**
     * Enables/disables distributed tracing.
     *
     * @env NEW_RELIC_DISTRIBUTED_TRACING_ENABLED
     */
    enabled: true
  },
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info'
  },

  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     *
     * NOTE: If excluding headers, they must be in camelCase form to be filtered.
     *
     * @env NEW_RELIC_ATTRIBUTES_EXCLUDE
     */
    exclude: ['request.headers.cookie', 'request.headers.authorization', 'request.headers.proxyAuthorization', 'request.headers.setCookie*', 'request.headers.x*', 'response.headers.cookie', 'response.headers.authorization', 'response.headers.proxyAuthorization', 'response.headers.setCookie*', 'response.headers.x*']
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25ld3JlbGljLmpzIl0sIm5hbWVzIjpbImV4cG9ydHMiLCJjb25maWciLCJhcHBfbmFtZSIsImRpc3RyaWJ1dGVkX3RyYWNpbmciLCJlbmFibGVkIiwibG9nZ2luZyIsImxldmVsIiwiYWxsb3dfYWxsX2hlYWRlcnMiLCJhdHRyaWJ1dGVzIiwiZXhjbHVkZSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FBLE9BQU8sQ0FBQ0MsTUFBUixHQUFpQjtBQUNmO0FBQ0Y7QUFDQTtBQUNFQyxFQUFBQSxRQUFRLEVBQUUsQ0FBQyxnQkFBRCxDQUpLOztBQUtmO0FBQ0Y7QUFDQTtBQUNFOztBQUNBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRUMsRUFBQUEsbUJBQW1CLEVBQUU7QUFDbkI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxJQUFBQSxPQUFPLEVBQUU7QUFOVSxHQWpCTjtBQXlCZkMsRUFBQUEsT0FBTyxFQUFFO0FBQ1A7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxJQUFBQSxLQUFLLEVBQUU7QUFOQSxHQXpCTTs7QUFpQ2Y7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNFQyxFQUFBQSxpQkFBaUIsRUFBRSxJQXRDSjtBQXVDZkMsRUFBQUEsVUFBVSxFQUFFO0FBQ1Y7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxJQUFBQSxPQUFPLEVBQUUsQ0FDUCx3QkFETyxFQUVQLCtCQUZPLEVBR1Asb0NBSE8sRUFJUCw0QkFKTyxFQUtQLG9CQUxPLEVBTVAseUJBTk8sRUFPUCxnQ0FQTyxFQVFQLHFDQVJPLEVBU1AsNkJBVE8sRUFVUCxxQkFWTztBQVRDO0FBdkNHLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG4vKipcbiAqIE5ldyBSZWxpYyBhZ2VudCBjb25maWd1cmF0aW9uLlxuICpcbiAqIFNlZSBsaWIvY29uZmlnL2RlZmF1bHQuanMgaW4gdGhlIGFnZW50IGRpc3RyaWJ1dGlvbiBmb3IgYSBtb3JlIGNvbXBsZXRlXG4gKiBkZXNjcmlwdGlvbiBvZiBjb25maWd1cmF0aW9uIHZhcmlhYmxlcyBhbmQgdGhlaXIgcG90ZW50aWFsIHZhbHVlcy5cbiAqL1xuZXhwb3J0cy5jb25maWcgPSB7XG4gIC8qKlxuICAgKiBBcnJheSBvZiBhcHBsaWNhdGlvbiBuYW1lcy5cbiAgICovXG4gIGFwcF9uYW1lOiBbJ1VwbG9hZCBTZXJ2aWNlJ10sXG4gIC8qKlxuICAgKiBZb3VyIE5ldyBSZWxpYyBsaWNlbnNlIGtleS5cbiAgICovXG4gIC8vbGljZW5zZV9rZXk6ICdsaWNlbnNlIGtleSBoZXJlJyxcbiAgLyoqXG4gICAqIFRoaXMgc2V0dGluZyBjb250cm9scyBkaXN0cmlidXRlZCB0cmFjaW5nLlxuICAgKiBEaXN0cmlidXRlZCB0cmFjaW5nIGxldHMgeW91IHNlZSB0aGUgcGF0aCB0aGF0IGEgcmVxdWVzdCB0YWtlcyB0aHJvdWdoIHlvdXJcbiAgICogZGlzdHJpYnV0ZWQgc3lzdGVtLiBFbmFibGluZyBkaXN0cmlidXRlZCB0cmFjaW5nIGNoYW5nZXMgdGhlIGJlaGF2aW9yIG9mIHNvbWVcbiAgICogTmV3IFJlbGljIGZlYXR1cmVzLCBzbyBjYXJlZnVsbHkgY29uc3VsdCB0aGUgdHJhbnNpdGlvbiBndWlkZSBiZWZvcmUgeW91IGVuYWJsZVxuICAgKiB0aGlzIGZlYXR1cmU6IGh0dHBzOi8vZG9jcy5uZXdyZWxpYy5jb20vZG9jcy90cmFuc2l0aW9uLWd1aWRlLWRpc3RyaWJ1dGVkLXRyYWNpbmdcbiAgICogRGVmYXVsdCBpcyBmYWxzZS5cbiAgICovXG4gIGRpc3RyaWJ1dGVkX3RyYWNpbmc6IHtcbiAgICAvKipcbiAgICAgKiBFbmFibGVzL2Rpc2FibGVzIGRpc3RyaWJ1dGVkIHRyYWNpbmcuXG4gICAgICpcbiAgICAgKiBAZW52IE5FV19SRUxJQ19ESVNUUklCVVRFRF9UUkFDSU5HX0VOQUJMRURcbiAgICAgKi9cbiAgICBlbmFibGVkOiB0cnVlXG4gIH0sXG4gIGxvZ2dpbmc6IHtcbiAgICAvKipcbiAgICAgKiBMZXZlbCBhdCB3aGljaCB0byBsb2cuICd0cmFjZScgaXMgbW9zdCB1c2VmdWwgdG8gTmV3IFJlbGljIHdoZW4gZGlhZ25vc2luZ1xuICAgICAqIGlzc3VlcyB3aXRoIHRoZSBhZ2VudCwgJ2luZm8nIGFuZCBoaWdoZXIgd2lsbCBpbXBvc2UgdGhlIGxlYXN0IG92ZXJoZWFkIG9uXG4gICAgICogcHJvZHVjdGlvbiBhcHBsaWNhdGlvbnMuXG4gICAgICovXG4gICAgbGV2ZWw6ICdpbmZvJ1xuICB9LFxuICAvKipcbiAgICogV2hlbiB0cnVlLCBhbGwgcmVxdWVzdCBoZWFkZXJzIGV4Y2VwdCBmb3IgdGhvc2UgbGlzdGVkIGluIGF0dHJpYnV0ZXMuZXhjbHVkZVxuICAgKiB3aWxsIGJlIGNhcHR1cmVkIGZvciBhbGwgdHJhY2VzLCB1bmxlc3Mgb3RoZXJ3aXNlIHNwZWNpZmllZCBpbiBhIGRlc3RpbmF0aW9uJ3NcbiAgICogYXR0cmlidXRlcyBpbmNsdWRlL2V4Y2x1ZGUgbGlzdHMuXG4gICAqL1xuICBhbGxvd19hbGxfaGVhZGVyczogdHJ1ZSxcbiAgYXR0cmlidXRlczoge1xuICAgIC8qKlxuICAgICAqIFByZWZpeCBvZiBhdHRyaWJ1dGVzIHRvIGV4Y2x1ZGUgZnJvbSBhbGwgZGVzdGluYXRpb25zLiBBbGxvd3MgKiBhcyB3aWxkY2FyZFxuICAgICAqIGF0IGVuZC5cbiAgICAgKlxuICAgICAqIE5PVEU6IElmIGV4Y2x1ZGluZyBoZWFkZXJzLCB0aGV5IG11c3QgYmUgaW4gY2FtZWxDYXNlIGZvcm0gdG8gYmUgZmlsdGVyZWQuXG4gICAgICpcbiAgICAgKiBAZW52IE5FV19SRUxJQ19BVFRSSUJVVEVTX0VYQ0xVREVcbiAgICAgKi9cbiAgICBleGNsdWRlOiBbXG4gICAgICAncmVxdWVzdC5oZWFkZXJzLmNvb2tpZScsXG4gICAgICAncmVxdWVzdC5oZWFkZXJzLmF1dGhvcml6YXRpb24nLFxuICAgICAgJ3JlcXVlc3QuaGVhZGVycy5wcm94eUF1dGhvcml6YXRpb24nLFxuICAgICAgJ3JlcXVlc3QuaGVhZGVycy5zZXRDb29raWUqJyxcbiAgICAgICdyZXF1ZXN0LmhlYWRlcnMueConLFxuICAgICAgJ3Jlc3BvbnNlLmhlYWRlcnMuY29va2llJyxcbiAgICAgICdyZXNwb25zZS5oZWFkZXJzLmF1dGhvcml6YXRpb24nLFxuICAgICAgJ3Jlc3BvbnNlLmhlYWRlcnMucHJveHlBdXRob3JpemF0aW9uJyxcbiAgICAgICdyZXNwb25zZS5oZWFkZXJzLnNldENvb2tpZSonLFxuICAgICAgJ3Jlc3BvbnNlLmhlYWRlcnMueConXG4gICAgXVxuICB9XG59XG4iXX0=