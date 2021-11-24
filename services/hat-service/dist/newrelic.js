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
  app_name: ['Hat Service'],

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25ld3JlbGljLmpzIl0sIm5hbWVzIjpbImV4cG9ydHMiLCJjb25maWciLCJhcHBfbmFtZSIsImRpc3RyaWJ1dGVkX3RyYWNpbmciLCJlbmFibGVkIiwibG9nZ2luZyIsImxldmVsIiwiYWxsb3dfYWxsX2hlYWRlcnMiLCJhdHRyaWJ1dGVzIiwiZXhjbHVkZSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FBLE9BQU8sQ0FBQ0MsTUFBUixHQUFpQjtBQUNmO0FBQ0Y7QUFDQTtBQUNFQyxFQUFBQSxRQUFRLEVBQUUsQ0FBQyxhQUFELENBSks7O0FBS2Y7QUFDRjtBQUNBO0FBQ0U7O0FBQ0E7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNFQyxFQUFBQSxtQkFBbUIsRUFBRTtBQUNuQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLElBQUFBLE9BQU8sRUFBRTtBQU5VLEdBakJOO0FBeUJmQyxFQUFBQSxPQUFPLEVBQUU7QUFDUDtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLElBQUFBLEtBQUssRUFBRTtBQU5BLEdBekJNOztBQWlDZjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0VDLEVBQUFBLGlCQUFpQixFQUFFLElBdENKO0FBdUNmQyxFQUFBQSxVQUFVLEVBQUU7QUFDVjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLElBQUFBLE9BQU8sRUFBRSxDQUNQLHdCQURPLEVBRVAsK0JBRk8sRUFHUCxvQ0FITyxFQUlQLDRCQUpPLEVBS1Asb0JBTE8sRUFNUCx5QkFOTyxFQU9QLGdDQVBPLEVBUVAscUNBUk8sRUFTUCw2QkFUTyxFQVVQLHFCQVZPO0FBVEM7QUF2Q0csQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcbi8qKlxuICogTmV3IFJlbGljIGFnZW50IGNvbmZpZ3VyYXRpb24uXG4gKlxuICogU2VlIGxpYi9jb25maWcvZGVmYXVsdC5qcyBpbiB0aGUgYWdlbnQgZGlzdHJpYnV0aW9uIGZvciBhIG1vcmUgY29tcGxldGVcbiAqIGRlc2NyaXB0aW9uIG9mIGNvbmZpZ3VyYXRpb24gdmFyaWFibGVzIGFuZCB0aGVpciBwb3RlbnRpYWwgdmFsdWVzLlxuICovXG5leHBvcnRzLmNvbmZpZyA9IHtcbiAgLyoqXG4gICAqIEFycmF5IG9mIGFwcGxpY2F0aW9uIG5hbWVzLlxuICAgKi9cbiAgYXBwX25hbWU6IFsnSGF0IFNlcnZpY2UnXSxcbiAgLyoqXG4gICAqIFlvdXIgTmV3IFJlbGljIGxpY2Vuc2Uga2V5LlxuICAgKi9cbiAgLy9saWNlbnNlX2tleTogJ2xpY2Vuc2Uga2V5IGhlcmUnLFxuICAvKipcbiAgICogVGhpcyBzZXR0aW5nIGNvbnRyb2xzIGRpc3RyaWJ1dGVkIHRyYWNpbmcuXG4gICAqIERpc3RyaWJ1dGVkIHRyYWNpbmcgbGV0cyB5b3Ugc2VlIHRoZSBwYXRoIHRoYXQgYSByZXF1ZXN0IHRha2VzIHRocm91Z2ggeW91clxuICAgKiBkaXN0cmlidXRlZCBzeXN0ZW0uIEVuYWJsaW5nIGRpc3RyaWJ1dGVkIHRyYWNpbmcgY2hhbmdlcyB0aGUgYmVoYXZpb3Igb2Ygc29tZVxuICAgKiBOZXcgUmVsaWMgZmVhdHVyZXMsIHNvIGNhcmVmdWxseSBjb25zdWx0IHRoZSB0cmFuc2l0aW9uIGd1aWRlIGJlZm9yZSB5b3UgZW5hYmxlXG4gICAqIHRoaXMgZmVhdHVyZTogaHR0cHM6Ly9kb2NzLm5ld3JlbGljLmNvbS9kb2NzL3RyYW5zaXRpb24tZ3VpZGUtZGlzdHJpYnV0ZWQtdHJhY2luZ1xuICAgKiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKi9cbiAgZGlzdHJpYnV0ZWRfdHJhY2luZzoge1xuICAgIC8qKlxuICAgICAqIEVuYWJsZXMvZGlzYWJsZXMgZGlzdHJpYnV0ZWQgdHJhY2luZy5cbiAgICAgKlxuICAgICAqIEBlbnYgTkVXX1JFTElDX0RJU1RSSUJVVEVEX1RSQUNJTkdfRU5BQkxFRFxuICAgICAqL1xuICAgIGVuYWJsZWQ6IHRydWVcbiAgfSxcbiAgbG9nZ2luZzoge1xuICAgIC8qKlxuICAgICAqIExldmVsIGF0IHdoaWNoIHRvIGxvZy4gJ3RyYWNlJyBpcyBtb3N0IHVzZWZ1bCB0byBOZXcgUmVsaWMgd2hlbiBkaWFnbm9zaW5nXG4gICAgICogaXNzdWVzIHdpdGggdGhlIGFnZW50LCAnaW5mbycgYW5kIGhpZ2hlciB3aWxsIGltcG9zZSB0aGUgbGVhc3Qgb3ZlcmhlYWQgb25cbiAgICAgKiBwcm9kdWN0aW9uIGFwcGxpY2F0aW9ucy5cbiAgICAgKi9cbiAgICBsZXZlbDogJ2luZm8nXG4gIH0sXG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIGFsbCByZXF1ZXN0IGhlYWRlcnMgZXhjZXB0IGZvciB0aG9zZSBsaXN0ZWQgaW4gYXR0cmlidXRlcy5leGNsdWRlXG4gICAqIHdpbGwgYmUgY2FwdHVyZWQgZm9yIGFsbCB0cmFjZXMsIHVubGVzcyBvdGhlcndpc2Ugc3BlY2lmaWVkIGluIGEgZGVzdGluYXRpb24nc1xuICAgKiBhdHRyaWJ1dGVzIGluY2x1ZGUvZXhjbHVkZSBsaXN0cy5cbiAgICovXG4gIGFsbG93X2FsbF9oZWFkZXJzOiB0cnVlLFxuICBhdHRyaWJ1dGVzOiB7XG4gICAgLyoqXG4gICAgICogUHJlZml4IG9mIGF0dHJpYnV0ZXMgdG8gZXhjbHVkZSBmcm9tIGFsbCBkZXN0aW5hdGlvbnMuIEFsbG93cyAqIGFzIHdpbGRjYXJkXG4gICAgICogYXQgZW5kLlxuICAgICAqXG4gICAgICogTk9URTogSWYgZXhjbHVkaW5nIGhlYWRlcnMsIHRoZXkgbXVzdCBiZSBpbiBjYW1lbENhc2UgZm9ybSB0byBiZSBmaWx0ZXJlZC5cbiAgICAgKlxuICAgICAqIEBlbnYgTkVXX1JFTElDX0FUVFJJQlVURVNfRVhDTFVERVxuICAgICAqL1xuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICdyZXF1ZXN0LmhlYWRlcnMuY29va2llJyxcbiAgICAgICdyZXF1ZXN0LmhlYWRlcnMuYXV0aG9yaXphdGlvbicsXG4gICAgICAncmVxdWVzdC5oZWFkZXJzLnByb3h5QXV0aG9yaXphdGlvbicsXG4gICAgICAncmVxdWVzdC5oZWFkZXJzLnNldENvb2tpZSonLFxuICAgICAgJ3JlcXVlc3QuaGVhZGVycy54KicsXG4gICAgICAncmVzcG9uc2UuaGVhZGVycy5jb29raWUnLFxuICAgICAgJ3Jlc3BvbnNlLmhlYWRlcnMuYXV0aG9yaXphdGlvbicsXG4gICAgICAncmVzcG9uc2UuaGVhZGVycy5wcm94eUF1dGhvcml6YXRpb24nLFxuICAgICAgJ3Jlc3BvbnNlLmhlYWRlcnMuc2V0Q29va2llKicsXG4gICAgICAncmVzcG9uc2UuaGVhZGVycy54KidcbiAgICBdXG4gIH1cbn1cbiJdfQ==