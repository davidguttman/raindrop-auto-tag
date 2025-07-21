require('dotenv').config({ quiet: true });

function levenshteinDistance(a, b) {
    const matrix = [];
    
    // Create matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

function deduplicateTags(tags) {
    const acceptedTags = [];
    
    for (const tag of tags) {
        let shouldAdd = true;
        
        for (const acceptedTag of acceptedTags) {
            if (levenshteinDistance(tag.toLowerCase(), acceptedTag.toLowerCase()) <= 2) {
                shouldAdd = false;
                break;
            }
        }
        
        if (shouldAdd) {
            acceptedTags.push(tag);
        }
    }
    
    return acceptedTags;
}

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
        
        // Find the first raindrop without tags (excluding those marked with #error)
        const untaggedRaindrop = data.items.find(raindrop => {
            if (!raindrop.tags || raindrop.tags.length === 0) {
                return true; // No tags at all
            }
            // Has tags but check if they're all empty strings and no #error tag
            return !raindrop.tags.includes('#error') && raindrop.tags.every(tag => tag === '');
        });

        if (untaggedRaindrop) {
            console.log(`Found untagged raindrop: "${untaggedRaindrop.title}"`);
            console.log(`URL: ${untaggedRaindrop.link}`);
            console.log(`Created: ${new Date(untaggedRaindrop.created).toLocaleString()}`);
            
            // Get tag suggestions
            console.log('\nGetting AI tag suggestions...');
            const tagSuggestions = await getTagSuggestions(untaggedRaindrop._id, token);
            
            if (tagSuggestions.length > 0) {
                console.log(`Original tags (${tagSuggestions.length}): ${tagSuggestions.join(', ')}`);
                
                // Remove similar tags using Levenshtein distance
                const deduplicatedTags = deduplicateTags(tagSuggestions);
                console.log(`Accepted tags (${deduplicatedTags.length}): ${deduplicatedTags.join(', ')}`);
                
                // Update the raindrop with the deduplicated tags
                console.log('\nApplying tags...');
                try {
                    const updateResult = await updateRaindropTags(untaggedRaindrop._id, deduplicatedTags, token);
                    console.log('✅ Raindrop successfully tagged!');
                } catch (error) {
                    console.log('❌ Failed to apply tags, marking with #error tag to prevent retry...');
                    try {
                        await updateRaindropTags(untaggedRaindrop._id, ['#error'], token);
                        console.log('🏷️ Added #error tag to prevent future attempts');
                    } catch (errorTagError) {
                        console.log('⚠️ Could not even apply #error tag - this raindrop may be stuck');
                    }
                }
            } else {
                console.log('❌ No tag suggestions found, marking with #error tag to prevent retry...');
                try {
                    await updateRaindropTags(untaggedRaindrop._id, ['#error'], token);
                    console.log('🏷️ Added #error tag to prevent future attempts');
                } catch (errorTagError) {
                    console.log('⚠️ Could not even apply #error tag - this raindrop may be stuck');
                }
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