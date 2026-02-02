
# Bloquear Zoom em Dispositivos Mobile

## Problema Identificado

Atualmente, a meta tag viewport no `index.html` permite zoom:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Isso permite que o usuario:
- Faca pinch-to-zoom (gesto de dois dedos)
- De double-tap para ampliar
- Isso pode causar comportamentos inesperados em um PWA

## Solucao

Adicionar atributos a meta tag viewport para desabilitar o zoom:

- `maximum-scale=1.0` - Limita o zoom maximo a 100%
- `user-scalable=no` - Desabilita o controle de zoom pelo usuario

## Alteracao Tecnica

**Arquivo:** `index.html`

**Linha 5 - Antes:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Depois:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

## Comportamento Apos Correcao

| Gesto | Antes | Depois |
|-------|-------|--------|
| Pinch-to-zoom | Permitido | Bloqueado |
| Double-tap zoom | Permitido | Bloqueado |
| Scroll normal | Funciona | Funciona |
| Inputs de texto | Zoom automatico | Sem zoom |

## Consideracao sobre Acessibilidade

Bloquear zoom pode afetar usuarios com deficiencia visual. Porem, como o AppFinance e um PWA focado em usabilidade mobile e ja possui fontes legíveis, essa restricao e aceitavel para garantir a estabilidade do sistema.

## Arquivos a Modificar

| Arquivo | Linha | Alteracao |
|---------|-------|-----------|
| `index.html` | 5 | Adicionar `maximum-scale=1.0, user-scalable=no` |

## Resultado Esperado

- O zoom fica completamente bloqueado em dispositivos mobile
- O sistema nao "buga" mais por zoom acidental
- A experiencia fica mais proxima de um app nativo
