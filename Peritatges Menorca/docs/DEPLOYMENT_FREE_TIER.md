# Guía de Despliegue en Servidores Gratuitos (Free Tier)
## PERITATGES MENORCA

Esta guía detalla cómo desplegar la aplicación **PERITATGES MENORCA** a coste cero (€0/mes) utilizando plataformas con capa gratuita generosa, qué límites tiene cada servicio y cómo migrar a producción cuando se alcance el límite.

---

### 1. Arquitectura Recomendada Sin Coste

| Componente | Proveedor Gratuito | Capacidad Gratuita | Tráfico / Descargas |
|---|---|---|---|
| **Frontend PWA** | **Vercel** o **Cloudflare Pages** | Despliegue ilimitado | 100 GB ancho de banda/mes |
| **API REST Backend** | **Render.com** o **Railway** | 500 horas/mes gratis (Render) | 100 GB/mes |
| **Base de Datos** | **Supabase** (PostgreSQL) | 500 MB base de datos gratis | Transferencia incluida |
| **Almacenamiento Fotos** | **Cloudflare R2** | **10 GB almacenamiento gratis** | **$0 / GB de descarga (Egress Free)** |

---

### 2. Paso a Paso: Almacenamiento de Fotografías en Cloudflare R2 (10 GB Gratis)

Cloudflare R2 es el proveedor ideal para peritos de vehículos porque **no cobra por el ancho de banda al descargar fotos o ZIPs**:

1. Crea una cuenta gratuita en [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Entra en **R2 Object Storage** y pulsa **Create bucket**. Nómbralo: `peritatges-menorca-storage`.
3. Ve a **Account Details** > **Manage R2 API Tokens** > **Create API Token**.
4. Copia las siguientes credenciales a tus variables de entorno (`.env`):
   ```env
   R2_ACCOUNT_ID=tu_account_id
   R2_ACCESS_KEY_ID=tu_access_key
   R2_SECRET_ACCESS_KEY=tu_secret_key
   R2_BUCKET_NAME=peritatges-menorca-storage
   ```

#### Límites de Cloudflare R2:
- **Almacenamiento gratis**: 10 GB/mes.
- **¿Cuántas fotos comprimidas caben gratis?**:
  - Gracias a la compresión cliente a ~600 KB por fotografía, 10 GB permiten almacenar aproximadamente **17.000 fotografías de vehículos** sin pagar nada.
- **¿Qué ocurre al superar 10 GB?**: Cloudflare cobra únicamente **$0,015 por GB adicional** al mes (por ejemplo, 50 GB costaría menos de 0,60 €/mes).

---

### 3. Paso a Paso: Frontend en Vercel

1. Sube el repositorio a GitHub o GitLab.
2. En [vercel.com](https://vercel.com), pulsa **Add New Project** e importa el repositorio.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. En **Environment Variables**, añade:
   ```env
   VITE_API_URL=https://tu-backend-en-render.onrender.com
   ```
7. Pulsa **Deploy**. Vercel generará automáticamente un dominio HTTPS con certificado SSL (`https://peritatges-menorca.vercel.app`).

---

### 4. Paso a Paso: Backend en Render.com (Free Tier)

1. En [render.com](https://render.com), crea una cuenta y pulsa **New Web Service**.
2. Selecciona tu repositorio de GitHub.
3. Configuración:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run server`
   - **Instance Type**: Free
4. Configura las variables de entorno de tu base de datos y Cloudflare R2.

---

### 5. ¿Qué ocurre si se alcanza el límite gratuito?

1. **Si se llenan los 500 MB de Supabase**:
   - Se puede depurar peritajes antiguos archivándolos en ZIP o actualizar al plan Pro de Supabase ($25/mes).
2. **Si se alcanzan los 10 GB de Cloudflare R2**:
   - No se bloquea el servicio: se factura automáticamente el excedente a precio ínfimo ($0.015/GB/mes).
3. **Modo Autónomo Local (Cero Servidor)**:
   - La aplicación está diseñada con arquitectura **Offline-First**. Incluso si el servidor se apaga o no está configurado, la aplicación funciona al 100% en el móvil del perito guardando fotos en IndexedDB y descargando ZIPs directamente desde el navegador.
