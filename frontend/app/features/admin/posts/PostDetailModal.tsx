import { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useAuth } from '~/hooks/useAuth';
import { commentService } from '~/services/comment.service';
import type { Comment } from '~/services/comment.service';
import ConfirmModal from '~/components/Shared/ConfirmModal';
import Notification from '~/components/Shared/Notification';
import SecureImage from '~/components/Shared/SecureImage';
import { formatTimeAgo } from './time';
import type { AdminPost as Post } from './types';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onImageClick: (imageUrl: string) => void;
}

export default function PostDetailModal({ isOpen, onClose, post, onImageClick }: PostDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-0">
      <button
        type="button"
        aria-label="Cerrar detalle de publicación"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de publicación"
        className="relative z-10 bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] mx-auto p-0 overflow-hidden flex flex-col"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de publicación"
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10 cursor-pointer bg-gray-800/50 hover:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
        >
          ×
        </button>
        
        <div className="flex flex-col sm:flex-row h-full">
          {/* Imagen arriba en móvil, izquierda en escritorio */}
          {post.media && (
            <div className="w-full sm:w-1/2 bg-black flex items-center justify-center relative max-h-72 sm:max-h-none">
              <button
                type="button"
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
              </button>
            </div>
          )}

          {/* Detalles y comentarios */}
          <div className={`${post.media ? 'w-full sm:w-1/2' : 'w-full'} flex flex-col h-full bg-gray-900`}>
            {/* Cabecera con información del usuario */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-2 rounded-lg transition-colors duration-200 text-left"
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
                </button>
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
                    <span className="text-blue-500">ðŸ’¬</span> {post.comments_count}
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
                <span className="text-blue-500">ðŸ’¬</span> Comentarios
              </h4>
              {comments.length === 0 ? (
                <div className="text-center text-gray-400 py-12 bg-gray-800/30 rounded-xl">
                  <span className="text-4xl mb-4 block">ðŸ’­</span>
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

