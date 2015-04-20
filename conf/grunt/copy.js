module.exports = {
  dist: {
    cwd: '<%= yeoman.app %>/',
    src: [ '**/*' ],
    dest: '<%= yeoman.dist %>/examples',
    expand: true
  },
  lib:{
    files: [
      { src:'<%= yeoman.app %>/scripts/directives/chart.js', dest:'<%= yeoman.dist %>/angular-metrics-graphics.js' },
      { src:'<%= yeoman.app %>/css/chart.css', dest:'<%= yeoman.dist %>/angular-metrics-graphics.css' }
    ]
  },
  vendor: {
    cwd: 'vendor',
    src: [ '**/*', '!**/src/**/*', '!**/test/**/*' ],
    dest: '<%= yeoman.dist %>/examples/vendor',
    expand: true
  }
}
