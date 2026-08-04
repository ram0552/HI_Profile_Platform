import React from 'react'

// Export 110+ Social Platforms list
export const SOCIAL_PLATFORMS = [
  // Websites
  "Website",
  "Portfolio",
  "Blog",

  // Developer
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Stack Overflow",
  "CodePen",
  "JSFiddle",
  "Replit",
  "Glitch",
  "CodeSandbox",
  "LeetCode",
  "HackerRank",
  "CodeChef",
  "HackerEarth",
  "TopCoder",
  "Kaggle",
  "Dev.to",
  "Hashnode",
  "Medium",
  "FreeCodeCamp",

  // Professional
  "LinkedIn",
  "AngelList",
  "Wellfound",
  "Crunchbase",
  "Indeed",
  "Upwork",
  "Fiverr",
  "Freelancer",
  "Toptal",

  // Social Media
  "Facebook",
  "Instagram",
  "Threads",
  "Twitter",
  "X",
  "Bluesky",
  "Mastodon",
  "Snapchat",
  "Pinterest",
  "Tumblr",
  "Reddit",
  "Quora",

  // Messaging
  "WhatsApp",
  "Telegram",
  "Discord",
  "Messenger",
  "Signal",
  "Skype",
  "WeChat",
  "Line",
  "Viber",

  // Video Platforms
  "YouTube",
  "TikTok",
  "Twitch",
  "Kick",
  "Vimeo",
  "Dailymotion",
  "Rumble",
  "Bilibili",

  // Music
  "Spotify",
  "Apple Music",
  "SoundCloud",
  "Bandcamp",
  "Audiomack",
  "Deezer",
  "Tidal",

  // Design
  "Dribbble",
  "Behance",
  "Figma",
  "Adobe Portfolio",
  "Canva",
  "ArtStation",
  "DeviantArt",

  // Creator Economy
  "Patreon",
  "Ko-fi",
  "Buy Me A Coffee",
  "Substack",
  "Gumroad",
  "Koji",
  "OnlyFans",

  // Ecommerce
  "Amazon",
  "Flipkart",
  "Shopify",
  "Etsy",
  "eBay",

  // Gaming
  "Steam",
  "Epic Games",
  "Xbox",
  "PlayStation",
  "Nintendo",
  "Roblox",

  // Mobile Apps
  "Google Play",
  "App Store",

  // Education
  "Coursera",
  "Udemy",
  "Skillshare",
  "edX",

  // Photography
  "Flickr",
  "500px",
  "Unsplash",
  "Pixiv",

  // Business
  "Google Business",
  "Google Maps",
  "Yelp",

  // Communities
  "Slack",
  "Guilded",
  "Discourse",

  // Crypto
  "Coinbase",
  "Binance",
  "OpenSea",

  // Contact
  "Email",
  "Phone",
  "SMS",
  "Address",

  // Documents
  "Resume",
  "CV",
  "Google Drive",
  "Dropbox",
  "Notion",

  // Misc
  "IMDb",
  "Product Hunt",
  "Wikipedia",
  "Linktree",
  "Bio.link",

  // Extra Enterprise-Level
  "Strava",
  "Letterboxd",
  "Goodreads",
  "ResearchGate",
  "ORCID",
  "Mixcloud",
  "Anchor",
  "VSCO",
  "Telegram Channel",
  "Discord Server",
  "Trello",
  "Jira",
  "Airtable",
  "Coda",
  "Miro",
  "Loom",
  "Calendly",
  "Zoom",
  "Google Meet",
  "Microsoft Teams",
  "PayPal",
  "Razorpay",
  "Stripe",
  "Paytm",
  "Venmo",
  "Cash App"
]

// Brand colors database mapping
const BRAND_COLORS = {
  website: '#3E66FB', portfolio: '#10B981', blog: '#F59E0B',
  github: '#24292F', gitlab: '#FC6D26', bitbucket: '#0052CC', 'stack overflow': '#F48024',
  codepen: '#000000', jsfiddle: '#4679a4', replit: '#007ACC', glitch: '#2800ff',
  codesandbox: '#151515', leetcode: '#FFA116', hackerrank: '#2EC866', codechef: '#5B4636',
  hackerearth: '#32373B', topcoder: '#29A8E0', kaggle: '#20BEFF', 'dev.to': '#0A0A0A',
  hashnode: '#2962FF', medium: '#000000', freecodecamp: '#0A0A23',
  linkedin: '#0A66C2', angellist: '#000000', wellfound: '#000000', crunchbase: '#0288D1',
  indeed: '#002F87', upwork: '#14A800', fiverr: '#1DBF73', freelancer: '#29B2FE', toptal: '#3863A0',
  facebook: '#1877F2', instagram: '#E1306C', threads: '#000000', twitter: '#1DA1F2', x: '#000000',
  bluesky: '#0085FF', mastodon: '#6364FF', snapchat: '#FFFC00', pinterest: '#E60023',
  tumblr: '#35465C', reddit: '#FF4500', quora: '#B92B27',
  whatsapp: '#25D366', telegram: '#229ED9', discord: '#5865F2', messenger: '#0084FF',
  signal: '#3A76F0', skype: '#00AFF0', wechat: '#07C160', line: '#06C755', viber: '#7360F2',
  youtube: '#FF0000', tiktok: '#000000', twitch: '#9146FF', kick: '#53FC18',
  vimeo: '#1AB7EA', dailymotion: '#0066DC', rumble: '#85B73E', bilibili: '#00A1D6',
  spotify: '#1DB954', 'apple music': '#FC3C44', soundcloud: '#FF3300', bandcamp: '#1EA0C4',
  audiomack: '#FFA200', deezer: '#FF0000', tidal: '#000000',
  dribbble: '#EA4C89', behance: '#0057FF', figma: '#F24E1E', 'adobe portfolio': '#000000',
  canva: '#00C4CC', artstation: '#13AFF0', deviantart: '#05CC47',
  patreon: '#FF424D', 'ko-fi': '#FF5E5B', 'buy me a coffee': '#FFDD00', substack: '#FF573C',
  gumroad: '#36A5E3', koji: '#FF3366', onlyfans: '#0088CC',
  amazon: '#FF9900', flipkart: '#2874F0', shopify: '#96BF48', etsy: '#D5641C', ebay: '#E53238',
  steam: '#000000', 'epic games': '#313131', xbox: '#107C10', playstation: '#003087',
  nintendo: '#E60012', roblox: '#111111',
  'google play': '#607D8B', 'app store': '#0070C9',
  coursera: '#0056D2', udemy: '#A435F0', skillshare: '#002333', edx: '#D91C5C',
  flickr: '#FF0084', '500px': '#000000', unsplash: '#000000', pixiv: '#0096FA',
  'google business': '#4285F4', 'google maps': '#4285F4', yelp: '#D32323',
  slack: '#4A154B', guilded: '#F5C400', discourse: '#212121',
  coinbase: '#0052FF', binance: '#F0B90B', opensea: '#2081E2',
  email: '#EA4335', phone: '#34A853', sms: '#00C853', address: '#DB4437',
  resume: '#2196F3', cv: '#4CAF50', 'google drive': '#4285F4', dropbox: '#0061FE', notion: '#000000',
  imdb: '#F5C518', 'product hunt': '#DA552F', wikipedia: '#000000', linktree: '#39E09B', 'bio.link': '#000000',
  strava: '#FC6200', letterboxd: '#FF8000', goodreads: '#372213', researchgate: '#00CCBB', orcid: '#A6CE39',
  mixcloud: '#52AAD8', anchor: '#5015B4', vsco: '#000000', 'telegram channel': '#229ED9', 'discord server': '#5865F2',
  trello: '#0079BF', jira: '#0052CC', airtable: '#18BFFF', coda: '#F05A28', miro: '#050038', loom: '#625DF5',
  calendly: '#006BFF', zoom: '#2D8CFF', 'google meet': '#00897B', 'microsoft teams': '#4B53BC',
  paypal: '#003087', razorpay: '#0A2540', stripe: '#008CDD', paytm: '#00B9F5', venmo: '#008CFF', 'cash app': '#00D632'
}

// ----------------------------------------------------
// 1. SPECIFIC HIGH-FIDELITY BRAND SVG ICONS
// ----------------------------------------------------

export const TwitterIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export const InstagramIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

export const LinkedinIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)

export const GithubIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
)

export const YoutubeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export const DribbbleIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.19 10.19 0 004.396-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.404a10.161 10.161 0 006.29 2.166c1.42 0 2.77-.29 4.006-.82zm-11.62-2.02c.29-.48 3.01-4.875 8.306-6.59.053-.017.104-.03.156-.047a28.51 28.51 0 00-.688-1.517c-5.104 1.528-10.064 1.465-10.512 1.457a10.204 10.204 0 002.738 6.697zM2.882 11.86c.457.006 4.732.032 9.51-1.252a88.32 88.32 0 00-3.817-5.882A10.19 10.19 0 002.882 11.86zm7.517-8.532c.194.26 2.305 3.176 3.855 5.948 3.674-1.377 5.227-3.465 5.414-3.726A10.137 10.137 0 0012 1.817c-1.093 0-2.145.176-3.108.5zm7.672 2.264c-.2.27-1.924 2.48-5.733 4.026a38.25 38.25 0 01.49 1.064l.169.397c3.39-.427 6.762.257 7.112.33a10.218 10.218 0 00-2.038-5.817z"/>
  </svg>
)

export const BehanceIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M22 17.002H15v1.233c0 .878.68 1.57 1.571 1.57h3.858c.89 0 1.571-.692 1.571-1.57v-1.233zM16.571 11h2.286c.891 0 1.571.692 1.571 1.571V14h-5.428v-1.429c0-.879.68-1.571 1.571-1.571zM8.568 13.916c0 .762-.572 1.39-1.332 1.39H4.148v-2.772h3.088c.76 0 1.332.628 1.332 1.382zm-.29-4.88c0 .694-.52 1.258-1.21 1.258H4.148V7.768h2.92c.69 0 1.21.564 1.21 1.268zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-2 2.059c0-2.868-2.062-4.908-5.143-4.908-3.08 0-5.143 2.04-5.143 4.908v.882c0 2.868 2.063 4.909 5.143 4.909 3.081 0 5.143-2.041 5.143-4.909v-.882zm-12 1.857c0-1.298-.69-2.286-2.086-2.585C9.31 12.87 10 11.892 10 10.73c0-2.261-1.857-3.73-4.444-3.73H1v13.998h4.556c2.587 0 4.444-1.469 4.444-3.73a3.42 3.42 0 0 0-.001-.21zm8.286-6.666h-5.429v1.43h5.429V9.25z"/>
  </svg>
)

export const FacebookIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
  </svg>
)

export const WhatsappIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export const DiscordIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0c-.172-.393-.412-.875-.63-1.25a.079.079 0 00-.078-.037 19.736 19.736 0 00-4.885 1.515.069.069 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
  </svg>
)

export const GoogleIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.527a5.99 5.99 0 0 1 5.99-5.99c2.455 0 4.48 1.554 5.21 3.738l3.96-1.54C21.735 4.887 18.21 2 13.99 2 8.163 2 3.437 6.727 3.437 12.554S8.163 23.11 13.99 23.11c5.776 0 10.435-4.167 10.435-10.285 0-.54-.055-1.08-.15-1.605H12.24z"/>
  </svg>
)

export const SpotifyIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.308c-.212.345-.664.457-1.008.243-2.783-1.702-6.286-2.087-10.413-1.144-.393.09-.792-.162-.882-.555-.09-.393.162-.792.555-.882 4.508-1.03 8.375-.595 11.5 1.316.345.212.457.664.243 1.008zm1.464-3.262c-.267.433-.833.574-1.266.307-3.187-1.958-8.046-2.525-11.815-1.382-.486.147-.997-.132-1.144-.618-.147-.486.132-.997.618-1.144 4.307-1.307 9.664-.672 13.315 1.572.433.267.574.833.307 1.266zm.126-3.41c-3.82-2.27-10.12-2.48-13.733-1.383-.586.178-1.205-.157-1.383-.743-.178-.586.157-1.205.743-1.383 4.167-1.265 11.13-1.01 15.545 1.614.526.312.7.992.388 1.518-.313.526-.992.7-1.518.388z"/>
  </svg>
)

export const SlackIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523 2.528 2.528 0 01-2.522-2.523 2.528 2.528 0 012.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 012.52-2.52h5.043a2.528 2.528 0 012.522 2.52v5.043a2.528 2.528 0 01-2.522 2.52H8.824a2.528 2.528 0 01-2.52-2.52v-5.043zm0-6.326a2.528 2.528 0 012.52-2.522 2.528 2.528 0 012.522 2.522v2.52H8.824a2.528 2.528 0 01-2.52-2.52zm0-1.261a2.528 2.528 0 012.52-2.522 2.528 2.528 0 012.522 2.522v5.043a2.528 2.528 0 01-2.522 2.52H8.824a2.528 2.528 0 01-2.52-2.52V7.578zm6.326-5.042a2.528 2.528 0 012.522-2.52 2.528 2.528 0 012.52 2.52v2.52h-2.52a2.528 2.528 0 01-2.522-2.52zm0 1.261a2.528 2.528 0 012.522 2.52v5.043a2.528 2.528 0 01-2.522 2.52H8.824a2.528 2.528 0 01-2.52-2.52V8.839zm6.327 6.326a2.528 2.528 0 012.52-2.52h2.52a2.528 2.528 0 012.522 2.52 2.528 2.528 0 01-2.522 2.523h-2.52v-2.523zm-1.262 0a2.528 2.528 0 01-2.52 2.52H10.08a2.528 2.528 0 01-2.52-2.52V10.08a2.528 2.528 0 012.52-2.52h5.043a2.528 2.528 0 012.52 2.52v5.043z"/>
  </svg>
)

export const TelegramIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.74 4-1.74 6.67-2.88 8.01-3.43 3.81-1.56 4.6-1.83 5.12-1.84.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.24z"/>
  </svg>
)

export const PaypalIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M20.007 8.002c-.754 3.903-3.328 6.002-7.55 6.002H9.362L7.994 22h-3.66L7.382 2.8h7.797c4.103 0 5.617 1.848 4.828 5.202zm-5.074.198c.365-1.9-.452-2.8-2.316-2.8H9.362l-1.368 7.6h2.905c1.9 0 3.328-.9 3.693-2.8h.334z"/>
  </svg>
)

export const StripeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M13.994 10.893c0-1.282.723-1.849 1.954-1.849 1.258 0 1.93.565 1.93 1.849 0 1.254-.672 1.848-1.93 1.848-1.231 0-1.954-.594-1.954-1.848zm-4.708 0c0-1.282.723-1.849 1.954-1.849 1.258 0 1.93.565 1.93 1.849 0 1.254-.672 1.848-1.93 1.848-1.231 0-1.954-.594-1.954-1.848zm4.708-4.996c0-1.282.723-1.849 1.954-1.849 1.258 0 1.93.565 1.93 1.849 0 1.254-.672 1.848-1.93 1.848-1.231 0-1.954-.594-1.954-1.848zm-4.708 0c0-1.282.723-1.849 1.954-1.849 1.258 0 1.93.565 1.93 1.849 0 1.254-.672 1.848-1.93 1.848-1.231 0-1.954-.594-1.954-1.848zm-1.848 12.18c0 3.396 2.766 6.162 6.162 6.162s6.162-2.766 6.162-6.162-2.766-6.162-6.162-6.162-6.162 2.766-6.162 6.162z"/>
  </svg>
)

export const NotionIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
    <path d="M4.6 2h14.8c1.4 0 2.6 1.2 2.6 2.6v14.8c0 1.4-1.2 2.6-2.6 2.6H4.6C3.2 22 2 20.8 2 19.4V4.6C2 3.2 3.2 2 4.6 2zm4.5 14.5l-1.3-4.9h-.1l-.6 1.8-1.1 3.1h-.9l-1.9-5.4h1.1l1.1 3.5h.1l.6-1.8 1.1-3.1h1l1.3 4.9h.1l1.1-3.5h1.1l-1.9 5.4h-.8zm7.3 0c-1.6 0-2.6-1-2.6-2.7s1-2.7 2.6-2.7 2.6 1 2.6 2.7-1 2.7-2.6 2.7zm0-1c.9 0 1.5-.7 1.5-1.7s-.6-1.7-1.5-1.7-1.5.7-1.5 1.7.6 1.7 1.5 1.7zm-2.9-6.3h-1.6V8.1h1.6v1.1z"/>
  </svg>
)

// ----------------------------------------------------
// 2. SEMANTIC CATEGORY FALLBACK SVG ICONS
// ----------------------------------------------------

export const GlobeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const CodeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

export const MessageIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export const VideoIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

export const MusicIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

export const DesignIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="M12 6A1.5 1.5 0 1 0 12 9A1.5 1.5 0 1 0 12 6Z" fill={color} />
    <path d="M7.5 9.5A1.5 1.5 0 1 0 7.5 12.5A1.5 1.5 0 1 0 7.5 9.5Z" fill={color} />
    <path d="M16.5 9.5A1.5 1.5 0 1 0 16.5 12.5A1.5 1.5 0 1 0 16.5 9.5Z" fill={color} />
    <path d="M12 14.5A1.5 1.5 0 1 0 12 17.5A1.5 1.5 0 1 0 12 14.5Z" fill={color} />
  </svg>
)

export const DollarIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

export const BookIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

export const CameraIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export const MapIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const FileIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

export const GameIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 12h4m-2-2v4M15 11h.01M18 13h.01" strokeWidth="3" />
  </svg>
)

export const BriefcaseIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

export const PhoneIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export const EmailIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

// ----------------------------------------------------
// 3. MASTER RESOLVERS (ICONS & BRAND COLORS)
// ----------------------------------------------------

export const getSocialIcon = (platform, size = 20, color = 'currentColor') => {
  const p = String(platform).toLowerCase().trim()

  // High-fidelity matches
  if (p.includes('github')) return <GithubIcon size={size} color={color} />
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return <TwitterIcon size={size} color={color} />
  if (p.includes('linkedin')) return <LinkedinIcon size={size} color={color} />
  if (p.includes('instagram')) return <InstagramIcon size={size} color={color} />
  if (p.includes('youtube')) return <YoutubeIcon size={size} color={color} />
  if (p.includes('dribbble')) return <DribbbleIcon size={size} color={color} />
  if (p.includes('behance')) return <BehanceIcon size={size} color={color} />
  if (p.includes('facebook')) return <FacebookIcon size={size} color={color} />
  if (p.includes('whatsapp')) return <WhatsappIcon size={size} color={color} />
  if (p.includes('discord')) return <DiscordIcon size={size} color={color} />
  if (p.includes('google')) return <GoogleIcon size={size} color={color} />
  if (p.includes('spotify')) return <SpotifyIcon size={size} color={color} />
  if (p.includes('slack')) return <SlackIcon size={size} color={color} />
  if (p.includes('telegram')) return <TelegramIcon size={size} color={color} />
  if (p.includes('paypal')) return <PaypalIcon size={size} color={color} />
  if (p.includes('stripe')) return <StripeIcon size={size} color={color} />
  if (p.includes('notion')) return <NotionIcon size={size} color={color} />
  if (p.includes('email') || p.includes('mail')) return <EmailIcon size={size} color={color} />
  if (p.includes('phone') || p.includes('tel')) return <PhoneIcon size={size} color={color} />

  // Semantic mappings
  // Developer
  if (['gitlab', 'bitbucket', 'stack overflow', 'codepen', 'jsfiddle', 'replit', 'glitch', 'codesandbox', 'leetcode', 'hackerrank', 'codechef', 'hackerearth', 'topcoder', 'kaggle', 'dev.to', 'hashnode', 'medium', 'freecodecamp', 'jira', 'trello', 'airtable', 'coda'].some(dev => p.includes(dev))) {
    return <CodeIcon size={size} color={color} />
  }
  // Video
  if (['tiktok', 'twitch', 'kick', 'vimeo', 'dailymotion', 'rumble', 'bilibili', 'loom', 'zoom', 'google meet', 'microsoft teams'].some(vid => p.includes(vid))) {
    return <VideoIcon size={size} color={color} />
  }
  // Music
  if (['apple music', 'soundcloud', 'bandcamp', 'audiomack', 'deezer', 'tidal', 'mixcloud', 'anchor'].some(mus => p.includes(mus))) {
    return <MusicIcon size={size} color={color} />
  }
  // Messaging/Communities
  if (['messenger', 'signal', 'skype', 'wechat', 'line', 'viber', 'bluesky', 'mastodon', 'threads', 'snapchat', 'pinterest', 'tumblr', 'reddit', 'quora', 'guilded', 'discourse'].some(msg => p.includes(msg))) {
    return <MessageIcon size={size} color={color} />
  }
  // Design/Art
  if (['figma', 'adobe portfolio', 'canva', 'artstation', 'deviantart', 'vsco'].some(des => p.includes(des))) {
    return <DesignIcon size={size} color={color} />
  }
  // Creator Economy / Ecommerce / Crypto / Payment
  if (['patreon', 'ko-fi', 'buy me a coffee', 'substack', 'gumroad', 'koji', 'onlyfans', 'amazon', 'flipkart', 'shopify', 'etsy', 'ebay', 'coinbase', 'binance', 'opensea', 'razorpay', 'paytm', 'venmo', 'cash app'].some(ec => p.includes(ec))) {
    return <DollarIcon size={size} color={color} />
  }
  // Education
  if (['coursera', 'udemy', 'skillshare', 'edx', 'researchgate', 'orcid', 'goodreads'].some(ed => p.includes(ed))) {
    return <BookIcon size={size} color={color} />
  }
  // Photography
  if (['flickr', '500px', 'unsplash', 'pixiv'].some(ph => p.includes(ph))) {
    return <CameraIcon size={size} color={color} />
  }
  // Maps/Business
  if (['google business', 'google maps', 'yelp', 'address', 'strava', 'maps'].some(mp => p.includes(mp))) {
    return <MapIcon size={size} color={color} />
  }
  // Documents
  if (['resume', 'cv', 'google drive', 'dropbox', 'miro'].some(doc => p.includes(doc))) {
    return <FileIcon size={size} color={color} />
  }
  // Gaming
  if (['steam', 'epic games', 'xbox', 'playstation', 'nintendo', 'roblox'].some(gam => p.includes(gam))) {
    return <GameIcon size={size} color={color} />
  }

  // Fallback to website/globe
  return <GlobeIcon size={size} color={color} />
}

export const getSocialBrandColor = (platform) => {
  const p = String(platform).toLowerCase().trim()
  
  // Find key in database that matches or is included in platform string
  const key = Object.keys(BRAND_COLORS).find(k => p.includes(k) || k.includes(p))
  if (key) {
    return BRAND_COLORS[key]
  }

  return '#3E66FB' // Default premium blue brand color
}
