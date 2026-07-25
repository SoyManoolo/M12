/**
 * Página de Administración de Publicaciones
 * 
 * Esta página permite gestionar todas las publicaciones de la aplicación.
 * Incluye:
 * - Lista de publicaciones con opciones de edición y eliminación
 * - Filtros y búsqueda
 * - Estadísticas de publicaciones
 */

import { useState, useEffect } from 'react';
import { useAuth } from '~/hooks/useAuth';
import Navbar from '~/components/Inicio/Navbar';
import { FaSearch, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { postService } from '~/services/post.service';
import { commentService } from '~/services/comment.service';
import type { Comment } from '~/services/comment.service';
import Notification from '~/components/Shared/Notification';
import ConfirmModal from '~/components/Shared/ConfirmModal';
import EditPostModal from '~/components/Shared/EditPostModal';
import ImageZoomModal from '~/components/Shared/ImageZoomModal';
import SecureImage from '../components/Shared/SecureImage';
import { mapAdminPost } from '~/features/admin/posts/post.mapper';
import type { AdminPost as Post, ApiAdminPost } from '~/features/admin/posts/types';
import { formatTimeAgo } from '~/features/admin/posts/time';
import { filterAdminPosts, type PostSort } from '~/features/admin/posts/filters';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onImageClick: (imageUrl: string) => void;
}

function PostDetailModal({ isOpen, onClose, post, onImageClick }: PostDetailModalProps) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cargar comentarios cuando se abre el modal
  useEffect(() => {
    const loadComments = async () => {
      if (!isOpen || !post) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await commentService.getComments(token, post.post_id);
        if (response.success && response.data.comments) {
          setComments(response.data.comments);
        }
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      }
    };

    loadComments();
  }, [isOpen, post]);

  const handleDeleteComment = async (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!token || !commentToDelete || !post) return;

    try {
      const response = await commentService.deleteComment(token, commentToDelete);
      if (response.success) {
        setComments(prev => prev.filter(comment => comment.comment_id !== commentToDelete));
        setNotification({
          message: 'Comentario eliminado correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar el comentario');
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al eliminar el comentario',
        type: 'error'
      });
    } finally {
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  if (!isOpen || !post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-0" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] mx-auto p-0 relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10 cursor-pointer bg-gray-800/50 hover:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
        >
          ×
        </button>
        
        <div className="flex flex-col sm:flex-row h-full">
          {/* Imagen arriba en móvil, izquierda en escritorio */}
          {post.media && (
            <div className="w-full sm:w-1/2 bg-black flex items-center justify-center relative max-h-72 sm:max-h-none">
              <div 
                className="w-full h-full flex items-center justify-center cursor-zoom-in group" 
                onClick={() => {
                  onClose();
                  onImageClick(post.media);
                }}
              >
                <SecureImage 
                  src={post.media} 
                  alt="Imagen publicación" 
                  className="max-h-72 sm:max-h-[90vh] w-auto object-contain transition-transform duration-300 group-hover:scale-105 mx-auto" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Click para ampliar
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detalles y comentarios */}
          <div className={`${post.media ? 'w-full sm:w-1/2' : 'w-full'} flex flex-col h-full bg-gray-900`}>
            {/* Cabecera con información del usuario */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-2 rounded-lg transition-colors duration-200" 
                  onClick={() => { window.location.href = `/perfil?username=${post.author.username}`; }}
                >
                  {post.author.profile_picture ? (
                    <SecureImage
                      src={post.author.profile_picture}
                      alt={post.author.username}
                      className="w-12 h-12 rounded-full ring-2 ring-blue-500/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 text-base font-bold">
                        {post.author.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg text-white">{post.author.name}</span>
                    <span className="text-sm text-gray-400">@{post.author.username}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción del post */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
              <p className="text-gray-200 whitespace-pre-line text-base break-words leading-relaxed">{post.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <span className="text-red-500">❤️</span> {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500">💬</span> {post.comments_count}
                  </span>
                </div>
                <span className="text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full text-xs">
                  {`hace ${formatTimeAgo(post.created_at)}`}
                </span>
              </div>
            </div>

            {/* Sección de comentarios */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/95 backdrop-blur-sm">
              <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500">💬</span> Comentarios
              </h4>
              {comments.length === 0 ? (
                <div className="text-center text-gray-400 py-12 bg-gray-800/30 rounded-xl">
                  <span className="text-4xl mb-4 block">💭</span>
                  <p className="text-lg">No hay comentarios aún</p>
                  <p className="text-sm mt-2">Sé el primero en comentar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.comment_id} className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors duration-200">
                      <div className="flex items-start gap-3 mb-1">
                        {/* Foto de perfil o inicial */}
                        {comment.author.profile_picture ? (
                          <SecureImage
                            src={comment.author.profile_picture}
                            alt={comment.author.username}
                            className="w-9 h-9 rounded-full"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                            <span className="text-gray-400 text-lg font-bold">
                              {comment.author.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Contenido del comentario y acciones */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-white mr-2">{comment.author.username}</span>
                              <span className="text-gray-300">{comment.content}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.comment_id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar comentario"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Fecha */}
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>{`hace ${formatTimeAgo(comment.created_at)}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteCommentModal}
        onClose={() => {
          setShowDeleteCommentModal(false);
          setCommentToDelete(null);
        }}
        onConfirm={confirmDeleteComment}
        title="Eliminar comentario"
        message="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default function AdminPublicaciones() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState<PostSort>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showGlobalImageZoomModal, setShowGlobalImageZoomModal] = useState(false);
  const [globalZoomImageUrl, setGlobalZoomImageUrl] = useState('');

  // Efecto para filtrar y ordenar posts
  useEffect(() => {
    setFilteredPosts(filterAdminPosts(posts, searchQuery, activeFilter));
  }, [searchQuery, posts, activeFilter]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Por favor, inicia sesión para ver las publicaciones');
        setLoading(false);
        return;
      }

      try {
        const response = await postService.getPosts(token);
        if (response.success) {
          const transformedPosts = response.data.posts.map((post: ApiAdminPost) => mapAdminPost(post));
          setPosts(transformedPosts);
          setFilteredPosts(transformedPosts); // Inicializar posts filtrados
          setNextCursor(response.data.nextCursor);
        } else {
          throw new Error(response.message || 'No pudimos cargar las publicaciones');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las publicaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLoadMore = async () => {
    if (!token || !nextCursor || loading) return;

    setLoading(true);
    try {
      const response = await postService.getPosts(token, nextCursor);
      if (response.success) {
        const transformedPosts = response.data.posts.map((post: ApiAdminPost) => mapAdminPost(post));
        const newPosts = [...posts, ...transformedPosts];
        setPosts(newPosts);
        // Actualizar también los posts filtrados
        if (!searchQuery.trim()) {
          setFilteredPosts(newPosts);
        } else {
          const query = searchQuery.toLowerCase().trim();
          const filtered = newPosts.filter(post => 
            post.author.username.toLowerCase().includes(query) ||
            post.author.name.toLowerCase().includes(query)
          );
          setFilteredPosts(filtered);
        }
        setNextCursor(response.data.nextCursor);
      } else {
        throw new Error(response.message || 'Error al cargar más posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.post_id === postId);
    if (post) {
      setPostToEdit(post);
      setShowEditModal(true);
    }
  };

  const handleUpdatePost = async (newDescription: string) => {
    if (!token || !postToEdit) return;

    try {
      const response = await postService.updatePost(token, postToEdit.post_id, newDescription);
      if (response.success) {
        setPosts(prev => prev.map(post => 
          post.post_id === postToEdit.post_id
            ? { ...post, description: newDescription }
            : post
        ));
        setNotification({
          message: 'Publicación actualizada correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al actualizar la publicación',
        type: 'error'
      });
    } finally {
      setShowEditModal(false);
      setPostToEdit(null);
    }
  };

  const confirmDelete = async () => {
    if (!token || !postToDelete) return;

    try {
      const response = await postService.deletePost(token, postToDelete);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.post_id !== postToDelete));
        setNotification({
          message: 'Publicación eliminada correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar la publicación');
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al eliminar la publicación',
        type: 'error'
      });
    } finally {
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <Navbar />
      
      <div className="w-full lg:w-5/6 lg:ml-[16.666667%] pt-16 pb-16 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4 sm:gap-0">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestión de Publicaciones
              </h1>
              <p className="text-gray-400 mt-2">Administra y modera el contenido de la plataforma</p>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative w-full sm:w-96">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de usuario..."
                className="w-full bg-gray-900 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <div className="flex items-center space-x-4">
              <FaFilter className="text-gray-400" />
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveFilter('recent')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'recent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Más recientes
              </button>
              <button 
                onClick={() => setActiveFilter('oldest')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeFilter === 'oldest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Más antiguas
              </button>
            </div>
          </div>

          {/* Lista de publicaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {error ? (
              <div className="col-span-3 bg-red-500/10 text-red-500 p-4 rounded-lg">
                {error}
              </div>
            ) : loading && filteredPosts.length === 0 ? (
              <div className="col-span-3 flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500">
                {searchQuery ? 'No se encontraron publicaciones para este usuario' : 'No hay publicaciones para mostrar'}
              </div>
            ) : (
              <>
                {filteredPosts.map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500 transition-colors flex flex-col w-full cursor-pointer"
                    onClick={() => { setSelectedPost(post); setShowPostModal(true); }}
                  >
                    {/* Cabecera con información del usuario */}
                    <div className="p-3 border-b border-gray-800 flex-shrink-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {post.author.profile_picture ? (
                            <SecureImage
                              src={post.author.profile_picture}
                              alt={post.author.username}
                              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-400 text-base font-bold">
                                {post.author.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{post.author.name}</h3>
                            <p className="text-xs text-gray-400 truncate">@{post.author.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button 
                            onClick={e => { e.stopPropagation(); handleEdit(post.post_id); }}
                            className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Editar publicación"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={e => { e.stopPropagation(); handleDelete(post.post_id); }}
                            className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar publicación"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Imagen cuadrada */}
                    <div className="w-full h-[300px] aspect-square relative overflow-hidden bg-gray-800 flex items-center justify-center">
                      {post.media ? (
                        <SecureImage 
                          src={post.media} 
                          alt="Contenido multimedia" 
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
                          <p className="text-sm text-gray-400 text-center p-4 line-clamp-4">
                            {post.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Pie de tarjeta con información */}
                    <div className="p-3 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 flex-shrink-0">
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex gap-3">
                          <span>❤️ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                        <span className="text-gray-500">
                          {`hace ${formatTimeAgo(post.created_at)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {nextCursor && !searchQuery && (
                  <div className="col-span-3 flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPostToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPostToEdit(null);
        }}
        onConfirm={handleUpdatePost}
        currentDescription={postToEdit?.description || ''}
      />

      <PostDetailModal 
        isOpen={showPostModal} 
        onClose={() => setShowPostModal(false)} 
        post={selectedPost} 
        onImageClick={(imageUrl) => {
          setGlobalZoomImageUrl(imageUrl);
          setShowGlobalImageZoomModal(true);
        }}
      />

      <ImageZoomModal
        isOpen={showGlobalImageZoomModal}
        onClose={() => setShowGlobalImageZoomModal(false)}
        imageUrl={globalZoomImageUrl}
        alt="Imagen de la publicación ampliada"
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 
