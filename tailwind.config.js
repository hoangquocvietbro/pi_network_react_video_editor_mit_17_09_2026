// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            keyframes: {
                progress: {
                    '0%': { width: '0%', marginLeft: '-100%' },
                    '50%': { width: '50%', marginLeft: '25%' },
                    '100%': { width: '100%', marginLeft: '100%' },
                },
            },
            animation: {
                progress: 'progress 2s infinite linear',
            },
        },
    },
}
