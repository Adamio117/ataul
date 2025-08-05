document.addEventListener('DOMContentLoaded', function() {
    // Price calculation
    const siteType = document.getElementById('site-type');
    const pages = document.getElementById('pages');
    const pagesValue = document.getElementById('pages-value');
    const features = document.getElementsByName('features');
    const urgency = document.getElementById('urgency');
    const calculateBtn = document.getElementById('calculate-btn');
    const calculatedPrice = document.getElementById('calculated-price');
    
    // Update pages value display
    pages.addEventListener('input', function() {
        pagesValue.textContent = this.value;
    });
    
    // Base prices for different site types
    const basePrices = {
        landing: 20000,
        corporate: 50000,
        shop: 80000,
        webapp: 120000
    };
    
    // Additional features prices
    const featurePrices = {
        design: 15000,
        seo: 10000,
        admin: 20000,
        multilang: 15000,
        payment: 25000,
        responsive: 10000
    };
    
    // Price per additional page
    const pricePerPage = {
        landing: 0, // Landing is one-page by default
        corporate: 2000,
        shop: 3000,
        webapp: 5000
    };
    
    // Calculate price function
    function calculatePrice() {
        const selectedType = siteType.value;
        const numPages = parseInt(pages.value);
        const urgencyFactor = parseFloat(urgency.value);
        
        // Calculate base price
        let price = basePrices[selectedType];
        
        // Add price for additional pages
        const basePages = selectedType === 'landing' ? 1 : 5;
        if (numPages > basePages) {
            price += (numPages - basePages) * pricePerPage[selectedType];
        }
        
        // Add price for selected features
        features.forEach(feature => {
            if (feature.checked) {
                price += featurePrices[feature.value];
            }
        });
        
        // Apply urgency factor
        price *= urgencyFactor;
        
        // Animate price change
        animateValue(calculatedPrice, parseInt(calculatedPrice.textContent) || 0, Math.round(price), 1000);
    }
    
    // Animate value change
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    // Calculate button click event
    calculateBtn.addEventListener('click', calculatePrice);
    
    // Initial calculation
    calculatePrice();
});