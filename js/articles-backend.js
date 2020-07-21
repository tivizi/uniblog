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
        loadByPage: async page => {
            if (!page || page < 1) {
                throw new Error('invalid page number')
            }
            let block = 1
            let metadata = articlesStorage.metadata()
            let articles = []
            if (metadata.current_block_count < 10) {
                block = metadata.current_block - page
                if (block < 1) {
                    throw new Error('- the end -')
                }
                if (page == 1) {
                    let articles_obj = await articlesStorage.articles(metadata.current_block)
                    console.debug('1 block:', articles_obj)
                    Object.keys(articles_obj).reverse().forEach(number => {
                        articles.push(articles_obj[number])
                    })
                }
            }
            let articles_obj = await articlesStorage.articles(block)
            console.debug(block, ' block:', articles_obj)
            Object.keys(articles_obj).reverse().forEach(number => {
                articles.push(articles_obj[number])
            })
            return articles
        }
    }
})