He creado una nueva clase `GameBase` para que la lógica de cada juego se maneje en un archivo separado. Esto hace que el `gameService` sea más escalable y mejora la base de código en general. Si añadimos muchos juegos, el `gameService` podría convertirse en un "Frankenstein". 

He cambiado la lógica a un sistema de acciones que son manejadas por cada juego según su configuración. Los juegos se registran en el `gameRegistry`, lo que hace que todo sea más localizable y fácil de depurar por cada juego. Además, la lógica de ranking ahora se centraliza por juego en lugar de tenerla en la interfaz de usuario.


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```




