(function(global, factory){
    // for node.js
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = {
            articlesStorage: factory()
        }
        return
    }
    // for browser
    global.articlesStorage = factory()
})(this, function() {
    const NAMESPACE = 'current-namespace'
    const ARTICLES_BLOCK = 'articles-block-'
    const ARTICLES_INDEX_KEY = 'articles-storage-index'

    async function _block_key(storage, block_number) {
        try {
            ns = (await storage.backend.load(NAMESPACE)).data
        } catch(e) {
            ns = storage.config.namespace; storage.backend.save(e.key, storage.config.namespace)
        }

        return ARTICLES_BLOCK + block_number + '@' + ns
    } 

    return {
        config: {
            namespace: 'tivizi/tivizi',
            block_size: 2
        },
        backend: {
            save: (key, obj) => {
                return new Promise((resolve, reject) => {
                    if (typeof localStorage === 'undefined') {
                        reject(new Error('this context not support localStorage.'))
                        return
                    }
                    try {
                        localStorage.setItem(key, JSON.stringify(obj))
                        resolve({
                            key: key,
                            data: obj
                        })    
                    } catch (e) {reject(e)}
                })
            },
            load: (key) => {
                return new Promise((resolve, reject) => {
                    if (typeof localStorage === 'undefined') {
                        reject(new Error('this context not support localStorage.'))
                        return
                    }
                    try {
                        let data_raw = localStorage.getItem(key)
                        if(!data_raw) {
                            let e = new Error('not found')
                            e.key = key
                            reject(e)
                            return
                        }
                        resolve({
                            key: key,
                            data: JSON.parse(data_raw)
                        })    
                    } catch (e) {e.key = key; reject(e)}
                })
            }
        },
        storeArticles: async function(articles) {
            try {
                ns = (await this.backend.load(NAMESPACE)).data
            } catch(e) {
                ns = this.config.namespace; this.backend.save(e.key, this.config.namespace)
            }

            try {
                block_index = (await this.backend.load(ARTICLES_INDEX_KEY + '@' + ns)).data
                block_key = ARTICLES_BLOCK + block_index.current_block + '@' + ns
            } catch(e) {
                block_index = {
                    current_block: 1,
                    inverted: {}
                }
                this.backend.save(e.key, block_index)
                block_key = ARTICLES_BLOCK + block_index.current_block + '@' + ns
            }
            try {
                current_block = (await this.backend.load(block_key)).data
            } catch(e) {
                current_block = {}
            }
            articles.forEach( article => {
                if (block_index.inverted[article.number]) {
                    if (block_index.current_block == block_index.inverted[article.number]) {
                        current_block[article.number] = article
                        return                        
                    }
                    let the_key = ARTICLES_BLOCK + block_index.inverted[article.number] + '@' + ns
                    this.backend.load(the_key).then(ret => {
                        let the_block = ret.data
                        the_block[article.number] = article
                        this.backend.save(the_key, the_block)
                    })
                    return
                }
                if(Object.keys(current_block).length < this.config.block_size) {
                    current_block[article.number] = article
                    block_index.inverted[article.number] = block_index.current_block
                    this.backend.save(ARTICLES_INDEX_KEY + '@' + ns, block_index)
                    return
                }
                this.backend.save(block_key, current_block)
                block_index.current_block = block_index.current_block + 1
                block_key = ARTICLES_BLOCK + block_index.current_block + '@' + ns
                current_block = {}
                current_block[article.number] = article
                block_index.inverted[article.number] = block_index.current_block
                this.backend.save(ARTICLES_INDEX_KEY + '@' + ns, block_index)
            })
            this.backend.save(block_key, current_block)
        },
        articles: async function(block_number) {
            return (await this.backend.load(await _block_key(this, block_number))).data
        },
        metadata: async function() {
            try {
                block_index = (await this.backend.load(ARTICLES_INDEX_KEY + '@' + ns)).data
            } catch(e) {
                block_index = {
                    current_block: 1,
                    inverted: {}
                }
                this.backend.save(e.key, block_index)
            }
            return block_index
        }
    }
})
