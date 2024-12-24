/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 开启图片优化
  images: {
    domains: ['www.tpfunc.top'],
  },
  // 开启压缩
  compress: true,
  // 添加响应头
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
