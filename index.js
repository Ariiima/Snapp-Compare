const styleElement = document.createElement('style');
styleElement.textContent = `
  .torob-info {
    background-color: #f8f8f8;
    border-radius: 8px;
    padding: 10px;
    margin-top: 10px;
    font-family: inherit;
    text-align-last: center;
  }
  .torob-price {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }
  .torob-comparison {
    font-size: 14px;
    padding: 2px 5px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 5px;
  }
  .torob-cheaper {
    background-color: #4CAF50;
    color: white;
  }
  .torob-expensive {
    background-color: #F44336;
    color: white;
  }
  .torob-link {
    display: inline-block;
    background-color: #d73948;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    text-decoration: none;

    font-size: 14px;
    transition: background-color 0.3s;
  }
  .torob-link:hover {
    background-color: #c62d3b;
  }
`;
document.head.appendChild(styleElement);

// Updated function to fetch data from Torob
async function fetchTorobData(productName) {
    const searchUrl = `https://torob.com/search/?query=${encodeURIComponent(productName)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    const priceMatch = html.match(/<div class="jsx-c3685eb9076392ea product-price-text">(.*?)<\/div>/);
    const linkMatch = html.match(/<a href="(\/p\/.*?)".*?class="jsx-c3685eb9076392ea">/);
    
    return {
      price: priceMatch ? priceMatch[1].trim() : 'Price not found',
      link: linkMatch ? 'https://torob.com' + linkMatch[1] : 'Link not found'
    };
  }
  
  function parsePrice(priceString) {
    const match = priceString.match(/(\d[\d,]*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
  }

  
  function getSnappPrice(priceElement) {
    const discountedPrice = priceElement.querySelector('.price');
    if (discountedPrice) {
      return parsePrice(discountedPrice.textContent);
    }
    return parsePrice(priceElement.textContent);
  }
  

async function appendTorobDataToCard(card) {
  const titleElement = card.querySelector('.ProductCard_product-card__title__nZguw');
  const priceElement = card.querySelector('.ProductCard_product-card-price__s9NJB');
  
  if (titleElement && priceElement && !card.querySelector('.torob-info')) {
    const productName = titleElement.textContent.trim();
    const torobData = await fetchTorobData(productName);
    
    const snappPrice = getSnappPrice(priceElement);
    const torobPrice = parsePrice(torobData.price);
    
    console.log(`Snapp Price: ${snappPrice}, Torob Price: ${torobPrice}`); // Debugging line

    let comparisonClass, comparisonText;
    if (torobPrice !== 0) {
      if (torobPrice < snappPrice) {
        comparisonClass = 'torob-cheaper';
        const difference = ((snappPrice - torobPrice) / snappPrice * 100).toFixed(2);
        comparisonText = `${difference}% ارزانتر`;
      } else if (torobPrice > snappPrice) {
        comparisonClass = 'torob-expensive';
        const difference = ((torobPrice - snappPrice) / snappPrice * 100).toFixed(2);
        comparisonText = `${difference}% گرانتر`;
      } else {
        comparisonClass = '';
        comparisonText = 'قیمت یکسان';
      }
    } else {
      comparisonClass = '';
      comparisonText = 'قیمت ترب نامشخص';
    }
    
    const torobInfoElement = document.createElement('div');
    torobInfoElement.className = 'torob-info';
    //<div class="torob-comparison ${comparisonClass}">${comparisonText}</div> // TODO: add this for price comparison
    torobInfoElement.innerHTML = `
      <div class="torob-price">قیمت ترب:</div>
      <div>${torobData.price}</div>
      <a href="${torobData.link}" target="_blank" class="torob-link">مشاهده در ترب</a>
    `;
    
    priceElement.insertAdjacentElement('afterend', torobInfoElement);
  }
}

function handleLazyLoadingAndAppendData() {
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        appendTorobDataToCard(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "200px" });

  const productCards = document.querySelectorAll('.PLPSection_plp-products-container__HSjLH > a');
  productCards.forEach(card => observer.observe(card));
}

// Run the script
handleLazyLoadingAndAppendData();

// Handle dynamically loaded content
const targetNode = document.querySelector('.PLPSection_plp-products-container__HSjLH');
const config = { childList: true, subtree: true };

const callback = function(mutationsList, observer) {
  for(let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.matches('.PLPSection_plp-products-container__HSjLH > a')) {
          appendTorobDataToCard(node);
        }
      });
    }
  }
};

const observer = new MutationObserver(callback);
observer.observe(targetNode, config);