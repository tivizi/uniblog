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
    const ETAG = 'articles-etag'
    const LAST_REQ_TIME = 'last-req-time'
    const ARTICLES_BLOCK = 'articles-block-'
    const ARTICLES_INDEX_KEY = 'articles-storage-index'

    async function _block_key(storage, block_number) {
        return ARTICLES_BLOCK + block_number + '@' + (await _ns(storage))
    }

    async function _ns(storage) {
        try {
            ns = (await storage.backend.load(NAMESPACE)).data
        } catch(e) {
            ns = storage.config.namespace; storage.backend.save(e.key, storage.config.namespace)
        }
        return ns
    }

    async function _etag(storage, number) {
        let ns = await _ns(storage)
        try {
            if(number) {
                return (await storage.backend.load(ETAG + '-' + number + '@' + ns)).data
            }
            return (await storage.backend.load(ETAG + '@' + ns)).data
        } catch(e) {
            return null
        }
        
    }

    async function _last_req_time(storage) {
        let ns = await _ns(storage)
        try {
            return (await storage.backend.load(LAST_REQ_TIME + '@' + ns)).data
        } catch(e) {
            return '2000-12-12T12:12:12Z'
        }
    }

    async function _flush_context(storage, ctx, number) {
        if (ctx.namespace) {
            storage.backend.save(NAMESPACE, ctx.namespace)                
        }

        let ns = await _ns(storage)

        if (!number) {
            storage.backend.save(ETAG + '@' + ns, ctx.articles_etag)
        } else {
            storage.backend.save(ETAG + '-' + number + '@' + ns, ctx.articles_etag)
        }

        if (ctx.last_req_time) {
            storage.backend.save(LAST_REQ_TIME + '@' + ns, ctx.last_req_time)
        }
    }

    return {
        config: {
            namespace: 'tivizi/tivizi',
            block_size: 20
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
        storeArticles: async function(articles, ctx, number) {
            _flush_context(this, ctx, number)
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
                    current_block_count: 0,
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
                // update
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

                // insert to exists block
                if(Object.keys(current_block).length < this.config.block_size) {
                    current_block[article.number] = article
                    block_index.inverted[article.number] = block_index.current_block
                    block_index.current_block_count = block_index.current_block_count + 1
                    this.backend.save(ARTICLES_INDEX_KEY + '@' + ns, block_index)
                    return
                }
                this.backend.save(block_key, current_block) // store full block

                // insert to new block
                block_index.current_block = block_index.current_block + 1
                block_index.current_block_count = 1
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
            let ns = await _ns(this)
            try {
                block_index = (await this.backend.load(ARTICLES_INDEX_KEY + '@' + ns)).data
            } catch(e) {
                block_index = {
                    current_block: 1,
                    current_block_count: 0,
                    inverted: {}
                }
                this.backend.save(e.key, block_index)
            }
            return block_index
        },
        context: async function(number) {
            let ns = await _ns(this)
            let articles_etag = await _etag(this, number)
            let last_req_time = await _last_req_time(this)

            return {
                namespace: ns,
                articles_etag: articles_etag,
                last_req_time: last_req_time 
            } 
        },
        setNamespace: async function(ns) {
            await this.backend.save(NAMESPACE, ns)
        }

    }
})
