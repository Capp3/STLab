/* MathJax 3 + Arithmatex (generic). Load tex-chtml.js after this file. Pin version in mkdocs.yml CDN URL. */
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [
      ['\\[', '\\]'],
      ['$$', '$$'],
    ],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    ignoreHtmlClass: '.*',
    processHtmlClass: 'arithmatex',
  },
};
