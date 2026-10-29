// Textos da moldura das figuras 3D (botões, rótulos, títulos de acessibilidade), num lugar só.
// O modelo tools/iso-glow/gallery-3d.html e os fig3d.js leem daqui. Para outra língua: copie
// este arquivo (ui.en.js, por exemplo), traduza os valores e aponte o <script> do modelo para ele.
// O texto das aulas e as falas de cada passo ficam em cada fig3d.js; não entram aqui.
window.UI = {
  lang: 'pt-BR',
  // painel de passos
  next: 'Próximo passo',
  prev: 'Voltar',
  restart: 'Recomeçar',
  auto: 'Tocar sozinho',
  space: 'espaço',
  iso: 'Vista isométrica',
  back: 'Voltar ao módulo',
  // barra do topo
  spin: 'Girar',
  spinTitle: 'Girar a câmera devagar em volta do objeto',
  spinAria: 'Girar a câmera em volta do objeto',
  themeTitle: 'Tema claro ou escuro (T)',
  themeAria: 'Alternar tema claro ou escuro',
  swatches: 'Cor do brilho',
  glow: 'Brilho',
  // cores do brilho; a chave em inglês é a que fica salva e é compartilhada com as galerias 2D
  accents: { Ember: 'Laranja', Cyan: 'Ciano', Lime: 'Verde-limão', Violet: 'Violeta', Rose: 'Rosa', Ice: 'Gelo' },
};
