((global, factory) => { 
    if (!global.document) {
        throw new Error('this script only can run inside brower.')
    }
    if (!global.articlesStorage) {
        throw new Error('articles-storage.js not found!')
    }
    global.backend = factory(global.articlesStorage)
})(this, (articlesStorage) => {
    return {
        config: {
            site_name: "Tivizi's Blog"
        },
        loadByPage: async page => {
            if (!page || page < 1) {
                throw new Error('invalid page number')
            }
            let metadata = await articlesStorage.metadata()
            let block = metadata.current_block - (page - 1)
            let articles = []
            if (metadata.current_block_count < 10) {
                block = metadata.current_block - page
                if (page == 1) {
                    let articles_obj = await articlesStorage.articles(metadata.current_block)
                    console.debug('1 block:', articles_obj)
                    Object.keys(articles_obj).reverse().forEach(number => {
                        articles.push(articles_obj[number])
                    })
                }
            }
            if (block < 1 && articles.length != 0) {
                return articles
            }
            if (block < 1) {
                throw new Error('- the end -')
            }
            let articles_obj = await articlesStorage.articles(block)
            console.debug(block, ' block:', articles_obj)
            Object.keys(articles_obj).reverse().forEach(number => {
                articles.push(articles_obj[number])
            })
            return articles
        },
        loadArticle: async number => {
            let metadata = await articlesStorage.metadata()
            let article = (await articlesStorage.articles(metadata.inverted[number]))[number]
            if (!article) {
                throw new Error('Not Found')
            }
            return article
        },
        flushNewestArticles: async () => {
            let ctx = await articlesStorage.context()

            let queryParams = '?per_page=256&direction=asc&since=' + ctx.last_req_time

            let response = 
                await fetch(new Request('https://api.github.com/repos/' + ctx.namespace + '/issues' + queryParams, {
                            method: 'GET',
                            headers: {
                                'If-None-Match': ctx.articles_etag
                            }
                        }
                    )
                )
            
            if(response.status == 304) {
                console.warn('304 Not Modified')
                return
            }
            ctx.articles_etag = response.headers.get('etag')
            
            let articles = await response.json()
            if (articles.length > 0) {
                ctx.last_req_time = new Date().toISOString()
            }

            articlesStorage.storeArticles(articles, ctx)
        },
        flushNewestArticle: async (number) => {
            if (!number) throw new Error('article number is required!')
            let ctx = await articlesStorage.context(number)

            let response = await fetch(new Request('https://api.github.com/repos/' + ctx.namespace + '/issues/' + number, {
                method: 'GET',
                headers: {
                    'If-None-Match': ctx.articles_etag
                }
            }))

            if(response.status == 404) {
                let e = new Error('404 Not Found');
                e.code = 404
                throw e 
            }

            if(response.status == 304) {
                console.warn('304 Not Modified')
                return
            }

            ctx.articles_etag = response.headers.get('etag')

            let article = await response.json()

            articlesStorage.storeArticles([article], ctx, number)

        }
    }
})