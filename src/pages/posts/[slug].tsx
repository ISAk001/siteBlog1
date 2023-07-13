import { GetServerSideProps } from 'next';
import styles from'./post.module.scss';

import { getPrismicClient } from '../../services/prismic';
import {RichText} from 'prismic-dom';
import { redirect } from 'next/dist/server/api-utils';

import Head from 'next/head';
import Image from 'next/image';

interface postProps{   
  post:{
    slug: string,
    title: string,
    description: string,
    cover: string,
    updatedAt: string
  }
}

export default function Post({ post } :postProps) {

  return(
    <>
     <Head>
      <title>{post.title}</title>
     </Head>
     <main className={styles.container}>
        <article className={styles.post}>
           <Image
             quality={100}
             src={post.cover}
             width={720}
             height={410}
             alt={post.title}
             placeholder='blur'
             blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO0YvjfBAADcgG9K6qdIwAAAABJRU5ErkJggg=="
           />

           <h1>{post.title}</h1>
           <time>{post.updatedAt}</time>
           <div className={styles.postContent} dangerouslySetInnerHTML={{ __html:post.description }}></div>
        </article>
     </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({req, params}) =>{
  const { slug } = params!;
  const prismic = getPrismicClient(req);

  const reponse = await prismic.getByUID('post', String(slug), {})
  
  if(!reponse){
    return{
       redirect:{
         destination: '/posts',
         permanent: false
       }
    }
  }
  
  const post ={
    slug: slug,
    title: RichText.asText(reponse.data.title),
    description: RichText.asHtml(reponse.data.description),
    cover:reponse.data.cover.url,
    updatedAt: reponse.last_publication_date
    ? new Date(reponse.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : null
};

 return{
   props:{
    post
   } 
 }
}