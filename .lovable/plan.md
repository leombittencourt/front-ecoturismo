

## Melhorar SEO e Banner Full-Width na Reserva

### 1. SEO da Landing Page

Adicionar meta tags dinamicas e estruturadas no `index.html` e criar um componente `SEOHead` usando `document.title` e meta tags via `useEffect` para as paginas publicas.

**Alteracoes em `index.html`:**
- Adicionar meta tags de SEO: `robots`, `canonical`, palavras-chave
- Melhorar a descricao para ser mais especifica e otimizada
- Adicionar dados estruturados (JSON-LD) do tipo `WebApplication` e `TouristAttraction`

**Criar `src/components/SEOHead.tsx`:**
- Componente que atualiza `document.title` e meta tags dinamicamente
- Usado nas paginas Index e Reservar com titulos/descricoes especificas

**Alteracoes em `src/pages/Index.tsx`:**
- Importar e usar SEOHead com titulo e descricao otimizados

**Alteracoes em `src/pages/Reservar.tsx`:**
- Importar e usar SEOHead com titulo e descricao para a pagina de reservas

### 2. Banner Full-Width na Tela de Reserva

Atualmente o banner na pagina `/reservar` esta dentro de um container `max-w-3xl mx-auto px-4`, o que limita sua largura e adiciona padding lateral.

**Alteracoes em `src/pages/Reservar.tsx` (linha 229-230):**
- Mover o `<BannerCarousel />` para fora do container `max-w-3xl`, colocando-o antes dele
- Garantir que ocupe 100% da largura sem padding

**Alteracoes em `src/components/BannerCarousel.tsx`:**
- Remover qualquer `rounded` das classes do container de imagem para eliminar bordas arredondadas quando usado full-width
- Adicionar uma prop opcional `fullWidth` para controlar o comportamento, ou simplesmente remover o arredondamento globalmente

### Detalhes Tecnicos

**SEOHead.tsx** usara `useEffect` para manipular meta tags no `<head>` do documento:
```text
- document.title = titulo
- meta[name="description"].content = descricao
- meta[property="og:title"].content = titulo
- meta[property="og:description"].content = descricao
```

**Reservar.tsx** - reestruturacao do layout:
```text
<div className="min-h-screen ...">
  <nav>...</nav>
  <BannerCarousel />              <-- movido para ca (full-width)
  <div className="max-w-3xl ..."> <-- container do formulario
    <div className="text-center">...</div>
    ...
  </div>
</div>
```

