

# Mover Simulador de Compra para dentro de Transações

## O que será feito

O Simulador de Compra já está acessível pela rota `/transactions/simulador` e aparece no submenu de Transações no menu lateral. A mudança é organizacional: mover o arquivo da página para a pasta correta (`src/pages/transactions/`) seguindo o padrão dos outros sub-módulos de Transações (como `Importar.tsx`).

## Alterações

### 1. Criar arquivo `src/pages/transactions/SimuladorCompra.tsx`

Mover o conteúdo de `src/pages/SimuladorCompra.tsx` para `src/pages/transactions/SimuladorCompra.tsx` sem alterações no código.

### 2. Atualizar import em `src/App.tsx`

Alterar o lazy import de:
```
"./pages/SimuladorCompra"
```
para:
```
"./pages/transactions/SimuladorCompra"
```

### 3. Remover `src/pages/SimuladorCompra.tsx`

Apagar o arquivo original que ficará obsoleto (o conteúdo estará no novo caminho).

## Resultado

A estrutura de arquivos ficará organizada assim:

```text
src/pages/transactions/
  Importar.tsx
  SimuladorCompra.tsx   <-- movido para cá
```

Nenhuma mudança visual, de rota ou de navegação -- apenas organização interna do código.
