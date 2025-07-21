require('dotenv').config({ quiet: true });

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
        return data.item?.tags || [];
    } catch (error) {
        console.error('Error getting tag suggestions:', error.message);
        return [];
    }
}

async function updateRaindropTags(raindropId, tags, token) {
    try {
        const response = await fetch(`https://api.raindrop.io/rest/v1/raindrop/${raindropId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tags: tags
            })
        });

        if (!response.ok) {
            throw new Error(`Update raindrop API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating raindrop tags:', error.message);
        throw error;
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
            console.log(`Found untagged raindrop: "${untaggedRaindrop.title}"`);
            console.log(`URL: ${untaggedRaindrop.link}`);
            console.log(`Created: ${new Date(untaggedRaindrop.created).toLocaleString()}`);
            
            // Get tag suggestions
            console.log('\nGetting AI tag suggestions...');
            const tagSuggestions = await getTagSuggestions(untaggedRaindrop._id, token);
            
            if (tagSuggestions.length > 0) {
                console.log(`Found ${tagSuggestions.length} suggested tags: ${tagSuggestions.join(', ')}`);
                
                // Update the raindrop with the suggested tags
                console.log('\nApplying tags...');
                const updateResult = await updateRaindropTags(untaggedRaindrop._id, tagSuggestions, token);
                console.log('✅ Raindrop successfully tagged!');
            } else {
                console.log('❌ No tag suggestions found');
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