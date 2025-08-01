// Accessibility functions
function toggleAccessibility() {
    const panel = document.getElementById('accessibilityPanel');
    panel.classList.toggle('hidden');
}

function changeFontSize(size) {
    const body = document.body;
    body.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
    body.classList.add(`font-${size}`);
    
    // Update active button
    document.querySelectorAll('.font-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Save preference
    localStorage.setItem('fontSize', size);
}

function changeColorMode(mode) {
    const body = document.body;
    body.classList.remove('color-normal', 'color-protanopia', 'color-deuteranopia', 'color-tritanopia');
    body.classList.add(`color-${mode}`);
    
    // Update active button
    document.querySelectorAll('.color-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Save preference
    localStorage.setItem('colorMode', mode);
}

function changeLetterSpacing(spacing) {
    const body = document.body;
    body.classList.remove('letter-normal', 'letter-wide', 'letter-wider');
    body.classList.add(`letter-${spacing}`);
    
    // Update active button
    document.querySelectorAll('.letter-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Save preference
    localStorage.setItem('letterSpacing', spacing);
}

function changeThemeMode(theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark', 'theme-comfort');
    body.classList.add(`theme-${theme}`);
    
    // Update logo images for dark mode
    const yakLogo = document.getElementById('yakLogo');
    const homepageLogo = document.querySelector('.homepage-logo');
    
    if (theme === 'dark') {
        if (yakLogo) {
            yakLogo.src = 'YakWhite.png';
            console.log('Set yakLogo to YakWhite.png', yakLogo);
        }
        if (homepageLogo) homepageLogo.src = 'YakBookWhite.png';
    } else {
        if (yakLogo) {
            yakLogo.src = 'Yak.png';
            console.log('Set yakLogo to Yak.png', yakLogo);
        }
        if (homepageLogo) homepageLogo.src = 'YakBook.png';
    }
    
    // Update active button
    document.querySelectorAll('.theme-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Save preference
    localStorage.setItem('themeMode', theme);
}

// Initialize accessibility settings
function initializeAccessibility() {
    // Load saved font size
    const savedFontSize = localStorage.getItem('fontSize') || 'normal';
    document.body.classList.add(`font-${savedFontSize}`);
    
    // Load saved color mode
    const savedColorMode = localStorage.getItem('colorMode') || 'normal';
    document.body.classList.add(`color-${savedColorMode}`);
    


    // Load saved letter spacing
    const savedLetterSpacing = localStorage.getItem('letterSpacing') || 'normal';
    document.body.classList.add(`letter-${savedLetterSpacing}`);
    
    // Load saved theme mode
    const savedThemeMode = localStorage.getItem('themeMode') || 'light';
    document.body.classList.add(`theme-${savedThemeMode}`);
    
    // Set initial logo images based on theme
    const yakLogo = document.getElementById('yakLogo');
    const homepageLogo = document.querySelector('.homepage-logo');
    const csuLogo = document.querySelector('.logo');
    
    if (savedThemeMode === 'dark') {
        if (yakLogo) {
            yakLogo.src = 'YakWhite.png';
            console.log('Initial set yakLogo to YakWhite.png', yakLogo);
        }
        if (homepageLogo) {
            homepageLogo.src = 'YakBookWhite.png';
            console.log('Initial set homepageLogo to YakBookWhite.png', homepageLogo);
        }
    }
    
    // Set active buttons
    setTimeout(() => {
        document.querySelectorAll('.font-controls button').forEach(btn => {
            if (btn.textContent.toLowerCase() === savedFontSize || 
                (savedFontSize === 'xlarge' && btn.textContent === 'Extra Large')) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.color-controls button').forEach(btn => {
            const modeMap = {
                'normal': 'Normal',
                'protanopia': 'Red-Blind',
                'deuteranopia': 'Green-Blind',
                'tritanopia': 'Blue-Blind'
            };
            if (btn.textContent === modeMap[savedColorMode]) {
                btn.classList.add('active');
            }
        });
        


        document.querySelectorAll('.letter-controls button').forEach(btn => {
            if (btn.textContent.toLowerCase() === savedLetterSpacing) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.theme-controls button').forEach(btn => {
            const themeMap = {
                'light': 'Light',
                'dark': 'Dark',
                'comfort': 'Eye Comfort'
            };
            if (btn.textContent === themeMap[savedThemeMode]) {
                btn.classList.add('active');
            }
        });
    }, 100);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAccessibility);