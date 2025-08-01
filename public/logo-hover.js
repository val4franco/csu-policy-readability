gidocument.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('yakLogo');
    
    logo.addEventListener('mousemove', function(e) {
        const rect = logo.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.1;
        
        logo.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
    
    logo.addEventListener('mouseleave', function() {
        logo.style.transform = 'translate(0, 0)';
    });
});