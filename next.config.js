/** @type {import('next').NextConfig} */
const nextConfig = {
    // Giúp gom nhóm các thư viện UI phổ biến để tránh tạo ra quá nhiều file JS nhỏ
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            '@designcombo/timeline',
            'remeda',
            'remotion'
        ],
    },
    // Nếu bạn đang load ảnh từ các domain bên ngoài (như vusercontent.net), 
    // hãy cấu hình ở đây để Next.js tối ưu hóa ảnh (giảm kích thước file)
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.vusercontent.net',
            },
        ],
    },
    // Đảm bảo không nén file hai lần nếu Vercel đã làm việc đó
    compress: true,
};

module.exports = nextConfig;
