require('dotenv').config();

async function getTagSuggestions(raindropId, token) {
    try {
        const response = await fetch(`https://api.raindrop.io/rest/v1/raindrop/${raindropId}/suggest`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Tag suggestions API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Full suggest API response:');
        console.log(JSON.stringify(data, null, 2));
        
        return data.item?.tags || [];
    } catch (error) {
        console.error('Error getting tag suggestions:', error.message);
        return [];
    }
}

async function findMostRecentUntaggedRaindrop() {
    const token = process.env.RD_TOKEN;
    
    if (!token) {
        throw new Error('RD_TOKEN not found in environment variables');
    }

    try {
        const response = await fetch('https://api.raindrop.io/rest/v1/raindrops/0?sort=-created', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Find the first raindrop without tags
        const untaggedRaindrop = data.items.find(raindrop => 
            !raindrop.tags || raindrop.tags.length === 0
        );

        if (untaggedRaindrop) {
            console.log('Most recent untagged raindrop:');
            console.log(JSON.stringify(untaggedRaindrop, null, 2));
            
            // Get tag suggestions
            console.log('\nGetting tag suggestions...');
            const tagSuggestions = await getTagSuggestions(untaggedRaindrop._id, token);
            
            if (tagSuggestions.length > 0) {
                console.log('\nTag suggestions:');
                tagSuggestions.forEach((tag, index) => {
                    console.log(`${index + 1}. ${tag}`);
                });
            } else {
                console.log('No tag suggestions found');
            }
            
        } else {
            console.log('No untagged raindrops found');
        }

        return untaggedRaindrop;
    } catch (error) {
        console.error('Error fetching raindrops:', error.message);
        throw error;
    }
}

// Run the function
findMostRecentUntaggedRaindrop().catch(console.error);