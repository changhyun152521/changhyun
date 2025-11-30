import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './NoticeCreate.css';

function NoticeEdit() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const editorRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && noticeId) {
      fetchNotice();
    }
  }, [isAdmin, noticeId]);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      if (userData.isAdmin !== true) {
        alert('관리자 권한이 필요합니다.');
        navigate(`/community/notice/${noticeId}`);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('사용자 데이터 파싱 오류:', error);
      alert('사용자 정보를 확인할 수 없습니다.');
      navigate(`/community/notice/${noticeId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotice = async () => {
    try {
      const response = await api.get(`/notices/${noticeId}`);
      if (response.data.success) {
        const notice = response.data.data;
        setTitle(notice.title || '');
        
        // 에디터에 기존 내용 삽입
        if (editorRef.current && notice.content) {
          editorRef.current.innerHTML = notice.content;
          
          // 기존 이미지와 표에 기능 초기화
          setTimeout(() => {
            initializeExistingImages();
            initializeExistingTables();
          }, 100);
        }

        // 첨부파일 정보 설정
        if (notice.attachments && notice.attachments.length > 0) {
          // 파일 첨부물
          const fileAttachments = notice.attachments.filter(att => att.type === 'file' || (!att.type && att.url && !att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)));
          setUploadedFiles(fileAttachments.map(att => ({
            type: 'file',
            url: att.url,
            filename: att.filename || att.originalName || '파일',
            originalName: att.originalName || att.filename || '파일',
            id: att._id || Date.now().toString(),
            size: att.size || '',
            format: att.mimetype || '',
          })));
          
          // 이미지 첨부물도 attachments에 추가
          const imageAttachments = notice.attachments.filter(att => 
            att.type === 'image' || 
            (att.url && att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ||
            (att.url && att.url.includes('cloudinary') && att.url.includes('image'))
          );
          
          // 모든 첨부물을 attachments에 추가
          const allAttachments = [
            ...fileAttachments.map(att => ({
              type: 'file',
              url: att.url,
              filename: att.filename || att.originalName || '',
              originalName: att.originalName || att.filename || '',
              id: att._id || Date.now().toString(),
            })),
            ...imageAttachments.map(att => ({
              type: 'image',
              url: att.url,
              filename: att.filename || att.originalName || '',
              originalName: att.originalName || att.filename || '',
              id: att._id || Date.now().toString(),
            }))
          ];
          
          setAttachments(allAttachments);
        }
        
        // 콘텐츠에서 이미지 URL 추출하여 attachments에 추가 (attachments에 없는 경우)
        if (editorRef.current && notice.content) {
          setTimeout(() => {
            const contentImages = editorRef.current.querySelectorAll('img');
            contentImages.forEach((img) => {
              const imgSrc = img.src;
              // attachments에 이미 있는지 확인
              setAttachments(prev => {
                const exists = prev.some(att => att.url === imgSrc);
                if (!exists && imgSrc && !imgSrc.includes('data:')) {
                  const newImageAttachment = {
                    type: 'image',
                    url: imgSrc,
                    filename: '',
                    originalName: '',
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  };
                  return [...prev, newImageAttachment];
                }
                return prev;
              });
            });
          }, 300);
        }
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
      alert('공지사항을 불러오는 중 오류가 발생했습니다.');
      navigate(`/community/notice/${noticeId}`);
    }
  };

  // 기존 이미지에 기능 초기화
  const initializeExistingImages = () => {
    if (!editorRef.current) return;
    
    // 먼저 래퍼 없이 있는 모든 이미지를 찾아서 래퍼로 감싸기
    const allImages = editorRef.current.querySelectorAll('img');
    allImages.forEach((img) => {
      // 이미 .image-wrapper 안에 있으면 스킵
      if (img.closest('.image-wrapper')) return;
      
      // 래퍼 생성
      const wrapper = document.createElement('span');
      wrapper.className = 'image-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline';
      wrapper.style.verticalAlign = 'baseline';
      wrapper.style.margin = '0';
      wrapper.setAttribute('contenteditable', 'false');
      
      // 이미지의 부모에서 이미지를 제거하고 래퍼로 감싸기
      const parent = img.parentNode;
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      
      // 이미지 스타일 설정
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'inline';
      img.style.verticalAlign = 'baseline';
      img.style.margin = '0';
      img.setAttribute('contenteditable', 'false');
      if (!img.hasAttribute('data-attachment-id')) {
        img.setAttribute('data-attachment-id', Date.now().toString() + Math.random().toString(36).substr(2, 9));
      }
      img.setAttribute('draggable', 'true');
    });
    
    // 이제 모든 .image-wrapper에 기능 추가
    const imageWrappers = editorRef.current.querySelectorAll('.image-wrapper');
    imageWrappers.forEach((wrapper) => {
      // 이미 삭제 버튼이나 리사이즈 핸들이 있으면 스킵
      if (wrapper.querySelector('.image-delete-btn') || wrapper.querySelector('.resize-handle')) {
        return;
      }

      const img = wrapper.querySelector('img');
      if (!img) return;

      // 이미지 src로 attachments에서 찾아서 id 설정
      const imgSrc = img.src;
      let attachmentId = img.getAttribute('data-attachment-id');
      
      // attachments state를 직접 참조할 수 없으므로, URL을 속성으로 저장
      if (!attachmentId) {
        attachmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        img.setAttribute('data-image-url', imgSrc); // URL을 속성으로 저장
      }
      
      img.setAttribute('data-attachment-id', attachmentId);
      img.setAttribute('draggable', 'true');

      // 삭제 버튼 추가
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'image-delete-btn';
      deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '-10px';
      deleteBtn.style.right = '-10px';
      deleteBtn.style.width = '22px';
      deleteBtn.style.height = '22px';
      deleteBtn.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
      deleteBtn.style.border = '2px solid white';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.opacity = '0';
      deleteBtn.style.transition = 'opacity 0.2s';
      deleteBtn.style.zIndex = '15';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.color = 'white';
      deleteBtn.style.fontSize = '10px';
      deleteBtn.style.padding = '0';
      deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
      
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('이 이미지를 삭제하시겠습니까?')) {
          // attachments 배열에서 제거 (id 또는 url로 매칭)
          const imgSrc = img.src || img.getAttribute('data-image-url');
          const imgId = attachmentId || img.getAttribute('data-attachment-id');
          
          setAttachments(prev => {
            return prev.filter(att => {
              // id나 url로 매칭하여 제거
              if (att.id === imgId) return false;
              if (att.url === imgSrc) return false;
              // URL이 부분적으로 일치하는 경우도 처리 (쿼리 파라미터 제거)
              if (imgSrc && att.url) {
                const imgUrlBase = imgSrc.split('?')[0];
                const attUrlBase = att.url.split('?')[0];
                if (imgUrlBase === attUrlBase) return false;
              }
              return true;
            });
          });
          
          // DOM에서 제거
          wrapper.remove();
          // 에디터 포커스 유지
          editorRef.current?.focus();
        }
      });
      
      // 리사이즈 핸들 추가
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '-5px';
      resizeHandle.style.right = '-5px';
      resizeHandle.style.width = '18px';
      resizeHandle.style.height = '18px';
      resizeHandle.style.backgroundColor = '#2196F3';
      resizeHandle.style.border = '2px solid white';
      resizeHandle.style.borderRadius = '50%';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.display = 'flex';
      resizeHandle.style.alignItems = 'center';
      resizeHandle.style.justifyContent = 'center';
      resizeHandle.style.color = 'white';
      resizeHandle.style.fontSize = '9px';
      resizeHandle.style.zIndex = '10';
      resizeHandle.style.opacity = '0';
      resizeHandle.style.transition = 'opacity 0.2s';
      resizeHandle.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      
      wrapper.appendChild(deleteBtn);
      wrapper.appendChild(resizeHandle);
      
      // 호버 이벤트
      wrapper.addEventListener('mouseenter', () => {
        resizeHandle.style.opacity = '1';
        deleteBtn.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', () => {
        resizeHandle.style.opacity = '0';
        deleteBtn.style.opacity = '0';
      });
      
      // 리사이즈 기능
      let isResizing = false;
      let startX, startY, startWidth, startHeight;
      
      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
      });
      
      const handleResize = (e) => {
        if (!isResizing) return;
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;
        const newWidth = Math.max(100, startWidth + diffX);
        const newHeight = Math.max(100, startHeight + diffY);
        
        const aspectRatio = startWidth / startHeight;
        if (Math.abs(diffX) > Math.abs(diffY)) {
          img.style.width = newWidth + 'px';
          img.style.height = (newWidth / aspectRatio) + 'px';
        } else {
          img.style.height = newHeight + 'px';
          img.style.width = (newHeight * aspectRatio) + 'px';
        }
        
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
      };
      
      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    });
  };

  // 기존 표에 기능 초기화
  const initializeExistingTables = () => {
    if (!editorRef.current) return;
    
    // 먼저 래퍼 없이 있는 모든 표를 찾아서 래퍼로 감싸기
    const allTables = editorRef.current.querySelectorAll('table');
    allTables.forEach((table) => {
      // 이미 .table-wrapper 안에 있으면 스킵
      if (table.closest('.table-wrapper')) return;
      
      // .editor-table이 아니고 일반 표인 경우도 처리
      if (!table.classList.contains('editor-table')) {
        table.classList.add('editor-table');
      }
      
      // 래퍼 생성
      const wrapper = document.createElement('span');
      wrapper.className = 'table-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline';
      wrapper.style.verticalAlign = 'baseline';
      wrapper.setAttribute('contenteditable', 'false'); // 표 래퍼는 편집 불가
      
      // 표의 부모에서 표를 제거하고 래퍼로 감싸기
      const parent = table.parentNode;
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      
      // 표 스타일 설정
      if (!table.style.width) {
        table.style.width = 'auto';
      }
      if (!table.style.minWidth) {
        table.style.minWidth = '300px';
      }
      table.style.borderCollapse = 'collapse';
      if (!table.style.margin) {
        table.style.margin = '0.25rem';
      }
      table.style.display = 'inline-table';
      table.style.verticalAlign = 'middle';
      if (!table.hasAttribute('data-table-id')) {
        table.setAttribute('data-table-id', Date.now().toString());
      }
    });
    
    // 이제 모든 .table-wrapper에 기능 추가
    const tableWrappers = editorRef.current.querySelectorAll('.table-wrapper');
    tableWrappers.forEach((wrapper) => {
      // 이미 삭제 버튼이나 리사이즈 핸들이 있으면 스킵
      if (wrapper.querySelector('.table-delete-btn') || wrapper.querySelector('.table-resize-handle')) {
        return;
      }

      const table = wrapper.querySelector('table');
      if (!table) return;

      // 삭제 버튼 추가
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'table-delete-btn';
      deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '5px';
      deleteBtn.style.right = '5px';
      deleteBtn.style.width = '28px';
      deleteBtn.style.height = '28px';
      deleteBtn.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
      deleteBtn.style.border = 'none';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.opacity = '0';
      deleteBtn.style.transition = 'opacity 0.2s';
      deleteBtn.style.zIndex = '15';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.color = 'white';
      deleteBtn.style.fontSize = '12px';
      deleteBtn.style.padding = '0';
      deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
      
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('이 표를 삭제하시겠습니까?')) {
          window.isDeletingElement = true;
          // DOM에서 제거
          wrapper.remove();
          // 에디터 포커스 유지
          editorRef.current?.focus();
          setTimeout(() => {
            window.isDeletingElement = false;
          }, 100);
        }
      });

      // 리사이즈 핸들 추가
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'table-resize-handle';
      resizeHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.right = '0';
      resizeHandle.style.width = '20px';
      resizeHandle.style.height = '20px';
      resizeHandle.style.backgroundColor = '#FF9800';
      resizeHandle.style.border = '2px solid white';
      resizeHandle.style.borderRadius = '50%';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.display = 'flex';
      resizeHandle.style.alignItems = 'center';
      resizeHandle.style.justifyContent = 'center';
      resizeHandle.style.color = 'white';
      resizeHandle.style.fontSize = '10px';
      resizeHandle.style.zIndex = '10';
      resizeHandle.style.opacity = '0';
      resizeHandle.style.transition = 'opacity 0.2s';
      resizeHandle.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

      wrapper.appendChild(deleteBtn);
      wrapper.appendChild(resizeHandle);

      // 호버 이벤트
      wrapper.addEventListener('mouseenter', () => {
        resizeHandle.style.opacity = '1';
        deleteBtn.style.opacity = '1';
      });
      wrapper.addEventListener('mouseleave', () => {
        resizeHandle.style.opacity = '0';
        deleteBtn.style.opacity = '0';
      });

      // 리사이즈 기능
      let isResizing = false;
      let startX, startWidth;

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = table.offsetWidth;
        
        document.addEventListener('mousemove', handleTableResize);
        document.addEventListener('mouseup', stopTableResize);
      });

      const handleTableResize = (e) => {
        if (!isResizing) return;
        const diffX = e.clientX - startX;
        const newWidth = Math.max(300, startWidth + diffX);
        table.style.width = newWidth + 'px';
        table.style.minWidth = newWidth + 'px';
      };

      const stopTableResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleTableResize);
        document.removeEventListener('mouseup', stopTableResize);
      };

      // 기존 셀에 리사이즈 및 색상 변경 기능 추가
      const cells = wrapper.querySelectorAll('th, td');
      cells.forEach((cell) => {
        if (cell.querySelector('.cell-width-handle')) return; // 이미 초기화됨
        
        cell.style.position = 'relative';
        cell.contentEditable = 'true';
        
        // 셀 리사이즈 핸들 및 색상 변경 버튼 추가
        const widthHandle = document.createElement('div');
        widthHandle.className = 'cell-width-handle';
        widthHandle.style.position = 'absolute';
        widthHandle.style.top = '0';
        widthHandle.style.right = '0';
        widthHandle.style.width = '4px';
        widthHandle.style.height = '100%';
        widthHandle.style.backgroundColor = '#2196F3';
        widthHandle.style.cursor = 'ew-resize';
        widthHandle.style.opacity = '0';
        widthHandle.style.transition = 'opacity 0.2s';
        widthHandle.style.zIndex = '5';

        const heightHandle = document.createElement('div');
        heightHandle.className = 'cell-height-handle';
        heightHandle.style.position = 'absolute';
        heightHandle.style.bottom = '0';
        heightHandle.style.left = '0';
        heightHandle.style.width = '100%';
        heightHandle.style.height = '4px';
        heightHandle.style.backgroundColor = '#2196F3';
        heightHandle.style.cursor = 'ns-resize';
        heightHandle.style.opacity = '0';
        heightHandle.style.transition = 'opacity 0.2s';
        heightHandle.style.zIndex = '5';

        const cornerHandle = document.createElement('div');
        cornerHandle.className = 'cell-corner-handle';
        cornerHandle.style.position = 'absolute';
        cornerHandle.style.bottom = '0';
        cornerHandle.style.right = '0';
        cornerHandle.style.width = '12px';
        cornerHandle.style.height = '12px';
        cornerHandle.style.backgroundColor = '#2196F3';
        cornerHandle.style.border = '2px solid white';
        cornerHandle.style.borderRadius = '2px';
        cornerHandle.style.cursor = 'nwse-resize';
        cornerHandle.style.opacity = '0';
        cornerHandle.style.transition = 'opacity 0.2s';
        cornerHandle.style.zIndex = '6';

        const colorBtn = document.createElement('button');
        colorBtn.className = 'cell-color-btn';
        colorBtn.innerHTML = '<i class="fas fa-palette"></i>';
        colorBtn.style.position = 'absolute';
        colorBtn.style.top = '2px';
        colorBtn.style.right = '2px';
        colorBtn.style.width = '24px';
        colorBtn.style.height = '24px';
        colorBtn.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
        colorBtn.style.border = 'none';
        colorBtn.style.borderRadius = '4px';
        colorBtn.style.cursor = 'pointer';
        colorBtn.style.opacity = '0';
        colorBtn.style.transition = 'opacity 0.2s';
        colorBtn.style.zIndex = '7';
        colorBtn.style.display = 'flex';
        colorBtn.style.alignItems = 'center';
        colorBtn.style.justifyContent = 'center';
        colorBtn.style.color = 'white';
        colorBtn.style.fontSize = '10px';
        colorBtn.style.padding = '0';

        cell.addEventListener('mouseenter', () => {
          widthHandle.style.opacity = '1';
          heightHandle.style.opacity = '1';
          cornerHandle.style.opacity = '1';
          colorBtn.style.opacity = '1';
        });

        cell.addEventListener('mouseleave', () => {
          widthHandle.style.opacity = '0';
          heightHandle.style.opacity = '0';
          cornerHandle.style.opacity = '0';
          colorBtn.style.opacity = '0';
        });

        // 셀 리사이즈 및 색상 변경 기능 (createTableCell과 동일한 로직)
        let isResizingWidth = false;
        let startX, startWidth;

        widthHandle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizingWidth = true;
          startX = e.clientX;
          startWidth = cell.offsetWidth;
          
          document.addEventListener('mousemove', handleWidthResize);
          document.addEventListener('mouseup', stopWidthResize);
        });

        const handleWidthResize = (e) => {
          if (!isResizingWidth) return;
          const diffX = e.clientX - startX;
          const newWidth = Math.max(50, startWidth + diffX);
          cell.style.width = newWidth + 'px';
          cell.style.minWidth = newWidth + 'px';
        };

        const stopWidthResize = () => {
          isResizingWidth = false;
          document.removeEventListener('mousemove', handleWidthResize);
          document.removeEventListener('mouseup', stopWidthResize);
        };

        let isResizingHeight = false;
        let startY, startHeight;

        heightHandle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizingHeight = true;
          startY = e.clientY;
          startHeight = cell.offsetHeight;
          
          document.addEventListener('mousemove', handleHeightResize);
          document.addEventListener('mouseup', stopHeightResize);
        });

        const handleHeightResize = (e) => {
          if (!isResizingHeight) return;
          const diffY = e.clientY - startY;
          const newHeight = Math.max(30, startHeight + diffY);
          cell.style.height = newHeight + 'px';
          cell.style.minHeight = newHeight + 'px';
        };

        const stopHeightResize = () => {
          isResizingHeight = false;
          document.removeEventListener('mousemove', handleHeightResize);
          document.removeEventListener('mouseup', stopHeightResize);
        };

        let isResizingCorner = false;

        cornerHandle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizingCorner = true;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = cell.offsetWidth;
          startHeight = cell.offsetHeight;
          
          document.addEventListener('mousemove', handleCornerResize);
          document.addEventListener('mouseup', stopCornerResize);
        });

        const handleCornerResize = (e) => {
          if (!isResizingCorner) return;
          const diffX = e.clientX - startX;
          const diffY = e.clientY - startY;
          const newWidth = Math.max(50, startWidth + diffX);
          const newHeight = Math.max(30, startHeight + diffY);
          cell.style.width = newWidth + 'px';
          cell.style.height = newHeight + 'px';
          cell.style.minWidth = newWidth + 'px';
          cell.style.minHeight = newHeight + 'px';
        };

        const stopCornerResize = () => {
          isResizingCorner = false;
          document.removeEventListener('mousemove', handleCornerResize);
          document.removeEventListener('mouseup', stopCornerResize);
        };

        // 색상 변경 버튼
        colorBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const colorPopup = document.createElement('div');
          colorPopup.className = 'cell-color-popup';
          colorPopup.style.position = 'absolute';
          colorPopup.style.top = '30px';
          colorPopup.style.right = '0';
          colorPopup.style.backgroundColor = 'white';
          colorPopup.style.border = '2px solid #e0e0e0';
          colorPopup.style.borderRadius = '8px';
          colorPopup.style.padding = '1rem';
          colorPopup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          colorPopup.style.zIndex = '1000';
          colorPopup.style.minWidth = '200px';

          const colorGrid = document.createElement('div');
          colorGrid.style.display = 'grid';
          colorGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
          colorGrid.style.gap = '0.5rem';
          colorGrid.style.marginBottom = '1rem';

          colorPalette.forEach((color) => {
            const colorBtn = document.createElement('button');
            colorBtn.style.width = '100%';
            colorBtn.style.aspectRatio = '1';
            colorBtn.style.border = '2px solid #e0e0e0';
            colorBtn.style.borderRadius = '4px';
            colorBtn.style.cursor = 'pointer';
            colorBtn.style.backgroundColor = color;
            colorBtn.style.padding = '0';
            colorBtn.addEventListener('click', () => {
              cell.style.backgroundColor = color;
              colorPopup.remove();
            });
            colorBtn.addEventListener('mouseenter', () => {
              colorBtn.style.transform = 'scale(1.1)';
              colorBtn.style.borderColor = '#2196F3';
            });
            colorBtn.addEventListener('mouseleave', () => {
              colorBtn.style.transform = 'scale(1)';
              colorBtn.style.borderColor = '#e0e0e0';
            });
            colorGrid.appendChild(colorBtn);
          });

          const customColorDiv = document.createElement('div');
          customColorDiv.style.display = 'flex';
          customColorDiv.style.alignItems = 'center';
          customColorDiv.style.gap = '0.75rem';
          customColorDiv.style.paddingTop = '0.75rem';
          customColorDiv.style.borderTop = '1px solid #e0e0e0';

          const customColorInput = document.createElement('input');
          customColorInput.type = 'color';
          customColorInput.style.width = '50px';
          customColorInput.style.height = '40px';
          customColorInput.style.border = '2px solid #e0e0e0';
          customColorInput.style.borderRadius = '6px';
          customColorInput.style.cursor = 'pointer';
          customColorInput.style.padding = '0';
          customColorInput.addEventListener('change', (e) => {
            cell.style.backgroundColor = e.target.value;
            colorPopup.remove();
          });

          const customColorLabel = document.createElement('span');
          customColorLabel.textContent = '커스텀 색상';
          customColorLabel.style.fontSize = '0.9rem';
          customColorLabel.style.color = '#495057';

          customColorDiv.appendChild(customColorInput);
          customColorDiv.appendChild(customColorLabel);

          colorPopup.appendChild(colorGrid);
          colorPopup.appendChild(customColorDiv);

          const existingPopup = cell.querySelector('.cell-color-popup');
          if (existingPopup) {
            existingPopup.remove();
          }

          cell.appendChild(colorPopup);

          const closePopup = (e) => {
            if (!colorPopup.contains(e.target) && e.target !== colorBtn) {
              colorPopup.remove();
              document.removeEventListener('mousedown', closePopup);
            }
          };
          setTimeout(() => {
            document.addEventListener('mousedown', closePopup);
          }, 100);
        });

        cell.appendChild(widthHandle);
        cell.appendChild(heightHandle);
        cell.appendChild(cornerHandle);
        cell.appendChild(colorBtn);
      });
    });
  };

  // 텍스트 포맷팅 함수들
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // 이미지 정렬 함수 - 텍스트 정렬과 함께 작동
  const alignImage = (alignment) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let targetElement = range.commonAncestorContainer;
    
    // 텍스트 노드인 경우 부모 요소로 이동
    if (targetElement.nodeType === Node.TEXT_NODE) {
      targetElement = targetElement.parentElement;
    }
    
    // 이미지 래퍼 찾기
    const imageWrapper = targetElement.closest('.image-wrapper');
    if (imageWrapper) {
      // 이미지가 선택된 경우, 부모 요소에 정렬 적용
      let parent = imageWrapper.parentElement;
      while (parent && parent !== editorRef.current) {
        if (parent.tagName === 'P' || parent.tagName === 'DIV' || parent.tagName === 'SPAN') {
          parent.style.textAlign = alignment;
          editorRef.current?.focus();
          return;
        }
        parent = parent.parentElement;
      }
    }
    
    // 이미지가 선택되지 않은 경우, 텍스트 정렬 명령 사용
    const commands = {
      'left': 'justifyLeft',
      'center': 'justifyCenter',
      'right': 'justifyRight'
    };
    if (commands[alignment]) {
      formatText(commands[alignment]);
    }
  };

  // 텍스트 색상 적용
  const applyTextColor = (color) => {
    formatText('foreColor', color);
    setShowTextColorPicker(false);
  };

  // 배경색 적용
  const applyBgColor = (color) => {
    formatText('backColor', color);
    setShowBgColorPicker(false);
  };

  // 줄간격 적용
  const applyLineHeight = (lineHeight) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    
    while (element && element !== editorRef.current) {
      if (element.tagName && ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(element.tagName)) {
        element.style.lineHeight = lineHeight;
        editorRef.current?.focus();
        return;
      }
      element = element.parentElement;
    }
    
    if (range.collapsed) {
      const p = document.createElement('p');
      p.style.lineHeight = lineHeight;
      p.innerHTML = '<br>';
      range.insertNode(p);
      range.setStartAfter(p);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const contents = range.extractContents();
      const p = document.createElement('p');
      p.style.lineHeight = lineHeight;
      p.appendChild(contents);
      range.insertNode(p);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    editorRef.current?.focus();
  };

  // 구분선 추가
  const insertHorizontalRule = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const hr = document.createElement('hr');
    hr.style.margin = '1.5rem 0';
    hr.style.border = 'none';
    hr.style.borderTop = '2px solid #e0e0e0';
    hr.setAttribute('contenteditable', 'false');

    range.insertNode(hr);
    range.setStartAfter(hr);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current?.focus();
  };

  // 표 추가 함수 (NoticeCreate와 동일)
  const insertTable = () => {
    const rows = prompt('행 수를 입력하세요 (1-20):', '3');
    const cols = prompt('열 수를 입력하세요 (1-10):', '3');
    
    if (!rows || !cols) return;
    
    const rowNum = parseInt(rows);
    const colNum = parseInt(cols);
    
    if (isNaN(rowNum) || isNaN(colNum) || rowNum < 1 || rowNum > 20 || colNum < 1 || colNum > 10) {
      alert('올바른 숫자를 입력해주세요. (행: 1-20, 열: 1-10)');
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    const tableWrapper = document.createElement('span');
    tableWrapper.className = 'table-wrapper';
    tableWrapper.style.position = 'relative';
    tableWrapper.style.display = 'inline';
    tableWrapper.style.verticalAlign = 'baseline';
    tableWrapper.setAttribute('contenteditable', 'false'); // 표 래퍼는 편집 불가
    
    const table = document.createElement('table');
    table.className = 'editor-table';
    table.style.width = 'auto';
    table.style.minWidth = '300px';
    table.style.borderCollapse = 'collapse';
    table.style.margin = '0';
    table.style.display = 'inline-table';
    table.style.verticalAlign = 'baseline';
    table.setAttribute('data-table-id', Date.now().toString());

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < colNum; i++) {
      const th = createTableCell('th', '헤더 ' + (i + 1), '#f5f5f5');
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i < rowNum - 1; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < colNum; j++) {
        const td = createTableCell('td', '&nbsp;', 'white');
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'table-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.width = '28px';
    deleteBtn.style.height = '28px';
    deleteBtn.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.opacity = '0';
    deleteBtn.style.transition = 'opacity 0.2s';
    deleteBtn.style.zIndex = '15';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.color = 'white';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.style.padding = '0';
    deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('이 표를 삭제하시겠습니까?')) {
        window.isDeletingElement = true;
        tableWrapper.remove();
        setTimeout(() => {
          window.isDeletingElement = false;
        }, 100);
      }
    });

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'table-resize-handle';
    resizeHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '20px';
    resizeHandle.style.height = '20px';
    resizeHandle.style.backgroundColor = '#FF9800';
    resizeHandle.style.border = '2px solid white';
    resizeHandle.style.borderRadius = '50%';
    resizeHandle.style.cursor = 'nwse-resize';
    resizeHandle.style.display = 'flex';
    resizeHandle.style.alignItems = 'center';
    resizeHandle.style.justifyContent = 'center';
    resizeHandle.style.color = 'white';
    resizeHandle.style.fontSize = '10px';
    resizeHandle.style.zIndex = '10';
    resizeHandle.style.opacity = '0';
    resizeHandle.style.transition = 'opacity 0.2s';
    resizeHandle.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

    tableWrapper.appendChild(table);
    tableWrapper.appendChild(deleteBtn);
    tableWrapper.appendChild(resizeHandle);

    tableWrapper.addEventListener('mouseenter', () => {
      resizeHandle.style.opacity = '1';
      deleteBtn.style.opacity = '1';
    });
    tableWrapper.addEventListener('mouseleave', () => {
      resizeHandle.style.opacity = '0';
      deleteBtn.style.opacity = '0';
    });

    let isResizing = false;
    let startX, startY, startWidth;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startWidth = table.offsetWidth;
      
      document.addEventListener('mousemove', handleTableResize);
      document.addEventListener('mouseup', stopTableResize);
    });

    const handleTableResize = (e) => {
      if (!isResizing) return;
      const diffX = e.clientX - startX;
      const newWidth = Math.max(300, startWidth + diffX);
      table.style.width = newWidth + 'px';
      table.style.minWidth = newWidth + 'px';
    };

    const stopTableResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleTableResize);
      document.removeEventListener('mouseup', stopTableResize);
    };

    range.insertNode(tableWrapper);
    range.setStartAfter(tableWrapper);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    editorRef.current?.focus();
  };

  // 표 정렬 함수
  // 표 정렬 함수 (더 이상 사용하지 않음 - 텍스트 정렬과 함께 작동)
  const alignTable = (alignment) => {
    // 표 정렬은 텍스트 정렬 기능을 사용하도록 변경
    const commands = {
      'left': 'justifyLeft',
      'center': 'justifyCenter',
      'right': 'justifyRight'
    };
    if (commands[alignment]) {
      formatText(commands[alignment]);
    }
  };

  // 셀 생성 함수 (NoticeCreate와 동일)
  const createTableCell = (tagName, content, defaultBgColor) => {
    const cell = document.createElement(tagName);
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '0.75rem';
    cell.style.backgroundColor = defaultBgColor;
    cell.style.textAlign = 'left';
    cell.style.position = 'relative';
    cell.contentEditable = 'true';
    cell.innerHTML = content;
    cell.style.minWidth = '80px';
    cell.style.minHeight = '40px';

    const widthHandle = document.createElement('div');
    widthHandle.className = 'cell-width-handle';
    widthHandle.style.position = 'absolute';
    widthHandle.style.top = '0';
    widthHandle.style.right = '0';
    widthHandle.style.width = '4px';
    widthHandle.style.height = '100%';
    widthHandle.style.backgroundColor = '#2196F3';
    widthHandle.style.cursor = 'ew-resize';
    widthHandle.style.opacity = '0';
    widthHandle.style.transition = 'opacity 0.2s';
    widthHandle.style.zIndex = '5';

    const heightHandle = document.createElement('div');
    heightHandle.className = 'cell-height-handle';
    heightHandle.style.position = 'absolute';
    heightHandle.style.bottom = '0';
    heightHandle.style.left = '0';
    heightHandle.style.width = '100%';
    heightHandle.style.height = '4px';
    heightHandle.style.backgroundColor = '#2196F3';
    heightHandle.style.cursor = 'ns-resize';
    heightHandle.style.opacity = '0';
    heightHandle.style.transition = 'opacity 0.2s';
    heightHandle.style.zIndex = '5';

    const cornerHandle = document.createElement('div');
    cornerHandle.className = 'cell-corner-handle';
    cornerHandle.style.position = 'absolute';
    cornerHandle.style.bottom = '0';
    cornerHandle.style.right = '0';
    cornerHandle.style.width = '12px';
    cornerHandle.style.height = '12px';
    cornerHandle.style.backgroundColor = '#2196F3';
    cornerHandle.style.border = '2px solid white';
    cornerHandle.style.borderRadius = '2px';
    cornerHandle.style.cursor = 'nwse-resize';
    cornerHandle.style.opacity = '0';
    cornerHandle.style.transition = 'opacity 0.2s';
    cornerHandle.style.zIndex = '6';

    const colorBtn = document.createElement('button');
    colorBtn.className = 'cell-color-btn';
    colorBtn.innerHTML = '<i class="fas fa-palette"></i>';
    colorBtn.style.position = 'absolute';
    colorBtn.style.top = '2px';
    colorBtn.style.right = '2px';
    colorBtn.style.width = '24px';
    colorBtn.style.height = '24px';
    colorBtn.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
    colorBtn.style.border = 'none';
    colorBtn.style.borderRadius = '4px';
    colorBtn.style.cursor = 'pointer';
    colorBtn.style.opacity = '0';
    colorBtn.style.transition = 'opacity 0.2s';
    colorBtn.style.zIndex = '7';
    colorBtn.style.display = 'flex';
    colorBtn.style.alignItems = 'center';
    colorBtn.style.justifyContent = 'center';
    colorBtn.style.color = 'white';
    colorBtn.style.fontSize = '10px';
    colorBtn.style.padding = '0';

    colorBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const colorPopup = document.createElement('div');
      colorPopup.className = 'cell-color-popup';
      colorPopup.style.position = 'absolute';
      colorPopup.style.top = '30px';
      colorPopup.style.right = '0';
      colorPopup.style.backgroundColor = 'white';
      colorPopup.style.border = '2px solid #e0e0e0';
      colorPopup.style.borderRadius = '8px';
      colorPopup.style.padding = '1rem';
      colorPopup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      colorPopup.style.zIndex = '1000';
      colorPopup.style.minWidth = '200px';

      const colorGrid = document.createElement('div');
      colorGrid.style.display = 'grid';
      colorGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
      colorGrid.style.gap = '0.5rem';
      colorGrid.style.marginBottom = '1rem';

      const colorPalette = [
        '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
        '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF', '#6600FF',
        '#FF0066', '#FF3366', '#FF6699', '#FF99CC', '#FFCCFF', '#CC99FF',
        '#9999FF', '#6699FF', '#3399FF', '#00CCFF', '#00FFCC', '#00FF99',
        '#66FF66', '#CCFF66', '#FFFF66', '#FFCC66', '#FF9966', '#FF6666',
      ];

      colorPalette.forEach((color) => {
        const colorBtn = document.createElement('button');
        colorBtn.style.width = '100%';
        colorBtn.style.aspectRatio = '1';
        colorBtn.style.border = '2px solid #e0e0e0';
        colorBtn.style.borderRadius = '4px';
        colorBtn.style.cursor = 'pointer';
        colorBtn.style.backgroundColor = color;
        colorBtn.style.padding = '0';
        colorBtn.addEventListener('click', () => {
          cell.style.backgroundColor = color;
          colorPopup.remove();
        });
        colorBtn.addEventListener('mouseenter', () => {
          colorBtn.style.transform = 'scale(1.1)';
          colorBtn.style.borderColor = '#2196F3';
        });
        colorBtn.addEventListener('mouseleave', () => {
          colorBtn.style.transform = 'scale(1)';
          colorBtn.style.borderColor = '#e0e0e0';
        });
        colorGrid.appendChild(colorBtn);
      });

      const customColorDiv = document.createElement('div');
      customColorDiv.style.display = 'flex';
      customColorDiv.style.alignItems = 'center';
      customColorDiv.style.gap = '0.75rem';
      customColorDiv.style.paddingTop = '0.75rem';
      customColorDiv.style.borderTop = '1px solid #e0e0e0';

      const customColorInput = document.createElement('input');
      customColorInput.type = 'color';
      customColorInput.style.width = '50px';
      customColorInput.style.height = '40px';
      customColorInput.style.border = '2px solid #e0e0e0';
      customColorInput.style.borderRadius = '6px';
      customColorInput.style.cursor = 'pointer';
      customColorInput.style.padding = '0';
      customColorInput.addEventListener('change', (e) => {
        cell.style.backgroundColor = e.target.value;
        colorPopup.remove();
      });

      const customColorLabel = document.createElement('span');
      customColorLabel.textContent = '커스텀 색상';
      customColorLabel.style.fontSize = '0.9rem';
      customColorLabel.style.color = '#495057';

      customColorDiv.appendChild(customColorInput);
      customColorDiv.appendChild(customColorLabel);

      colorPopup.appendChild(colorGrid);
      colorPopup.appendChild(customColorDiv);

      const existingPopup = cell.querySelector('.cell-color-popup');
      if (existingPopup) {
        existingPopup.remove();
      }

      cell.appendChild(colorPopup);

      const closePopup = (e) => {
        if (!colorPopup.contains(e.target) && e.target !== colorBtn) {
          colorPopup.remove();
          document.removeEventListener('mousedown', closePopup);
        }
      };
      setTimeout(() => {
        document.addEventListener('mousedown', closePopup);
      }, 100);
    });

    cell.addEventListener('mouseenter', () => {
      widthHandle.style.opacity = '1';
      heightHandle.style.opacity = '1';
      cornerHandle.style.opacity = '1';
      colorBtn.style.opacity = '1';
    });

    cell.addEventListener('mouseleave', () => {
      widthHandle.style.opacity = '0';
      heightHandle.style.opacity = '0';
      cornerHandle.style.opacity = '0';
      colorBtn.style.opacity = '0';
    });

    let isResizingWidth = false;
    let startX, startWidth;

    widthHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingWidth = true;
      startX = e.clientX;
      startWidth = cell.offsetWidth;
      
      document.addEventListener('mousemove', handleWidthResize);
      document.addEventListener('mouseup', stopWidthResize);
    });

    const handleWidthResize = (e) => {
      if (!isResizingWidth) return;
      const diffX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diffX);
      cell.style.width = newWidth + 'px';
      cell.style.minWidth = newWidth + 'px';
    };

    const stopWidthResize = () => {
      isResizingWidth = false;
      document.removeEventListener('mousemove', handleWidthResize);
      document.removeEventListener('mouseup', stopWidthResize);
    };

    let isResizingHeight = false;
    let startY, startHeight;

    heightHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingHeight = true;
      startY = e.clientY;
      startHeight = cell.offsetHeight;
      
      document.addEventListener('mousemove', handleHeightResize);
      document.addEventListener('mouseup', stopHeightResize);
    });

    const handleHeightResize = (e) => {
      if (!isResizingHeight) return;
      const diffY = e.clientY - startY;
      const newHeight = Math.max(30, startHeight + diffY);
      cell.style.height = newHeight + 'px';
      cell.style.minHeight = newHeight + 'px';
    };

    const stopHeightResize = () => {
      isResizingHeight = false;
      document.removeEventListener('mousemove', handleHeightResize);
      document.removeEventListener('mouseup', stopHeightResize);
    };

    let isResizingCorner = false;

    cornerHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingCorner = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = cell.offsetWidth;
      startHeight = cell.offsetHeight;
      
      document.addEventListener('mousemove', handleCornerResize);
      document.addEventListener('mouseup', stopCornerResize);
    });

    const handleCornerResize = (e) => {
      if (!isResizingCorner) return;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      const newWidth = Math.max(50, startWidth + diffX);
      const newHeight = Math.max(30, startHeight + diffY);
      cell.style.width = newWidth + 'px';
      cell.style.height = newHeight + 'px';
      cell.style.minWidth = newWidth + 'px';
      cell.style.minHeight = newHeight + 'px';
    };

    const stopCornerResize = () => {
      isResizingCorner = false;
      document.removeEventListener('mousemove', handleCornerResize);
      document.removeEventListener('mouseup', stopCornerResize);
    };

    cell.appendChild(widthHandle);
    cell.appendChild(heightHandle);
    cell.appendChild(cornerHandle);
    cell.appendChild(colorBtn);

    return cell;
  };

  // 기본 색상 팔레트
  const colorPalette = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF', '#6600FF',
    '#FF0066', '#FF3366', '#FF6699', '#FF99CC', '#FFCCFF', '#CC99FF',
    '#9999FF', '#6699FF', '#3399FF', '#00CCFF', '#00FFCC', '#00FF99',
    '#66FF66', '#CCFF66', '#FFFF66', '#FFCC66', '#FF9966', '#FF6666',
  ];

  // 이미지 업로드
  const handleImageUpload = () => {
    // Cloudinary가 로드되었는지 확인
    if (!window.cloudinary) {
      alert('이미지 업로드 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drdqg5pc0';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mathchang';
    
    try {
      const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: true,
        maxFileSize: 10000000, // 10MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        folder: 'mathchang/notices/images',
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          const newAttachment = {
            type: 'image',
            url: imageUrl,
            filename: result.info.original_filename || '',
            originalName: result.info.original_filename || '',
            id: Date.now().toString(),
          };
          setAttachments([...attachments, newAttachment]);
          
          const imgWrapper = document.createElement('span');
          imgWrapper.className = 'image-wrapper';
          imgWrapper.style.position = 'relative';
          imgWrapper.style.display = 'inline';
          imgWrapper.style.verticalAlign = 'baseline';
          imgWrapper.style.margin = '0';
          imgWrapper.setAttribute('data-attachment-id', newAttachment.id);
          imgWrapper.setAttribute('contenteditable', 'false'); // 이미지 래퍼는 편집 불가
          
          const img = document.createElement('img');
          img.src = imageUrl;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.display = 'inline';
          img.style.verticalAlign = 'baseline';
          img.style.margin = '0';
          img.setAttribute('data-attachment-id', newAttachment.id);
          img.setAttribute('draggable', 'true');
          img.setAttribute('contenteditable', 'false'); // 이미지는 편집 불가
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'image-delete-btn';
          deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
          deleteBtn.style.position = 'absolute';
          deleteBtn.style.top = '-10px';
          deleteBtn.style.right = '-10px';
          deleteBtn.style.width = '22px';
          deleteBtn.style.height = '22px';
          deleteBtn.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
          deleteBtn.style.border = '2px solid white';
          deleteBtn.style.borderRadius = '50%';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.opacity = '0';
          deleteBtn.style.transition = 'opacity 0.2s';
          deleteBtn.style.zIndex = '15';
          deleteBtn.style.display = 'flex';
          deleteBtn.style.alignItems = 'center';
          deleteBtn.style.justifyContent = 'center';
          deleteBtn.style.color = 'white';
          deleteBtn.style.fontSize = '10px';
          deleteBtn.style.padding = '0';
          deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
          
          deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.confirm('이 이미지를 삭제하시겠습니까?')) {
              setAttachments(prev => prev.filter(att => att.id !== newAttachment.id));
              imgWrapper.remove();
            }
          });
          
          const resizeHandle = document.createElement('div');
          resizeHandle.className = 'resize-handle';
          resizeHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';
          resizeHandle.style.position = 'absolute';
          resizeHandle.style.bottom = '-5px';
          resizeHandle.style.right = '-5px';
          resizeHandle.style.width = '18px';
          resizeHandle.style.height = '18px';
          resizeHandle.style.backgroundColor = '#2196F3';
          resizeHandle.style.border = '2px solid white';
          resizeHandle.style.borderRadius = '50%';
          resizeHandle.style.cursor = 'nwse-resize';
          resizeHandle.style.display = 'flex';
          resizeHandle.style.alignItems = 'center';
          resizeHandle.style.justifyContent = 'center';
          resizeHandle.style.color = 'white';
          resizeHandle.style.fontSize = '9px';
          resizeHandle.style.zIndex = '10';
          resizeHandle.style.opacity = '0';
          resizeHandle.style.transition = 'opacity 0.2s';
          resizeHandle.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
          
          imgWrapper.appendChild(img);
          imgWrapper.appendChild(deleteBtn);
          imgWrapper.appendChild(resizeHandle);
          
          imgWrapper.addEventListener('mouseenter', () => {
            resizeHandle.style.opacity = '1';
            deleteBtn.style.opacity = '1';
          });
          imgWrapper.addEventListener('mouseleave', () => {
            resizeHandle.style.opacity = '0';
            deleteBtn.style.opacity = '0';
          });
          
          let isResizing = false;
          let startX, startY, startWidth, startHeight;
          
          resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = img.offsetWidth;
            startHeight = img.offsetHeight;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
          });
          
          const handleResize = (e) => {
            if (!isResizing) return;
            const diffX = e.clientX - startX;
            const diffY = e.clientY - startY;
            const newWidth = Math.max(100, startWidth + diffX);
            const newHeight = Math.max(100, startHeight + diffY);
            
            const aspectRatio = startWidth / startHeight;
            if (Math.abs(diffX) > Math.abs(diffY)) {
              img.style.width = newWidth + 'px';
              img.style.height = (newWidth / aspectRatio) + 'px';
            } else {
              img.style.height = newHeight + 'px';
              img.style.width = (newHeight * aspectRatio) + 'px';
            }
            
            img.style.maxWidth = 'none';
            img.style.maxHeight = 'none';
          };
          
          const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
          };

          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(imgWrapper);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current?.appendChild(imgWrapper);
          }
        }
      }
    );
    
      widget.open();
    } catch (error) {
      console.error('이미지 업로드 위젯 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
    }
  };

  // 동영상 링크 추가
  const handleVideoAdd = () => {
    const videoUrl = prompt('동영상 URL을 입력하세요 (YouTube, Vimeo 등):');
    if (!videoUrl) return;

    let embedUrl = videoUrl;
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (videoUrl.includes('vimeo.com/')) {
      const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
    }

    const newAttachment = {
      type: 'video',
      url: embedUrl,
      originalUrl: videoUrl,
      filename: '',
      originalName: '',
      id: Date.now().toString(),
    };
    setAttachments([...attachments, newAttachment]);

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.style.position = 'relative';
    videoWrapper.style.display = 'inline-block';
    videoWrapper.style.width = '100%';
    videoWrapper.style.maxWidth = '100%';
    videoWrapper.setAttribute('contenteditable', 'false');
    videoWrapper.setAttribute('data-attachment-id', newAttachment.id);
    
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.setAttribute('data-attachment-id', newAttachment.id);
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('frameborder', '0');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'video-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '5px';
    deleteBtn.style.right = '5px';
    deleteBtn.style.width = '28px';
    deleteBtn.style.height = '28px';
    deleteBtn.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.opacity = '0';
    deleteBtn.style.transition = 'opacity 0.2s';
    deleteBtn.style.zIndex = '15';
    deleteBtn.style.display = 'flex';
    deleteBtn.style.alignItems = 'center';
    deleteBtn.style.justifyContent = 'center';
    deleteBtn.style.color = 'white';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.style.padding = '0';
    deleteBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('이 동영상을 삭제하시겠습니까?')) {
        setAttachments(prev => prev.filter(att => att.id !== newAttachment.id));
        videoWrapper.remove();
      }
    });
    
    videoWrapper.appendChild(iframe);
    videoWrapper.appendChild(deleteBtn);

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(videoWrapper);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current?.appendChild(videoWrapper);
    }
  };

  // 파일 업로드
  const handleFileUpload = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drdqg5pc0';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mathchang';
    
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local'],
        multiple: true,
        maxFileSize: 50000000, // 50MB
        folder: 'mathchang/notices/files',
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const fileUrl = result.info.secure_url;
          const fileSize = result.info.bytes || 0;
          const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
          
          const newFile = {
            type: 'file',
            url: fileUrl,
            filename: result.info.original_filename || '파일',
            originalName: result.info.original_filename || '파일',
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            size: fileSizeMB,
            format: result.info.format || '',
          };
          
          setUploadedFiles(prev => [...prev, newFile]);
          
          const newAttachment = {
            type: 'file',
            url: fileUrl,
            filename: result.info.original_filename || '',
            originalName: result.info.original_filename || '',
            id: newFile.id,
          };
          setAttachments([...attachments, newAttachment]);
        }
      }
    );
    
    widget.open();
  };

  // 파일 삭제
  const handleFileDelete = (fileId) => {
    if (window.confirm('이 파일을 삭제하시겠습니까?')) {
      // uploadedFiles에서 해당 파일 찾기
      const fileToDelete = uploadedFiles.find(file => file.id === fileId);
      
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      
      // attachments에서도 제거 (id 또는 url로 매칭)
      setAttachments(prev => {
        return prev.filter(att => {
          // id로 매칭
          if (att.id === fileId) return false;
          // url로 매칭 (기존 파일의 경우 id가 다를 수 있음)
          if (fileToDelete && att.url === fileToDelete.url) return false;
          // URL이 부분적으로 일치하는 경우도 처리 (쿼리 파라미터 제거)
          if (fileToDelete && att.url && fileToDelete.url) {
            const attUrlBase = att.url.split('?')[0];
            const fileUrlBase = fileToDelete.url.split('?')[0];
            if (attUrlBase === fileUrlBase) return false;
          }
          return true;
        });
      });
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (size) => {
    if (!size) return '';
    return `${size} MB`;
  };

  // 색상 선택기 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.color-picker-wrapper')) {
        setShowTextColorPicker(false);
        setShowBgColorPicker(false);
      }
    };

    if (showTextColorPicker || showBgColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTextColorPicker, showBgColorPicker]);

  // 이미지와 표 삭제 방지
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // beforeinput 이벤트로 삭제 방지
    const handleBeforeInput = (e) => {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;
      
      // 이미지나 표가 선택되어 있거나 포함되어 있는지 확인
      let node = startContainer;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList?.contains('image-wrapper') || 
              node.classList?.contains('table-wrapper') ||
              node.tagName === 'IMG' ||
              node.tagName === 'TABLE' ||
              node.closest('.image-wrapper') ||
              node.closest('.table-wrapper')) {
            e.preventDefault();
            return;
          }
        }
        node = node.parentNode;
      }

      // 선택된 영역에 이미지나 표가 포함되어 있는지 확인
      const selectedContent = range.cloneContents();
      const hasImage = selectedContent.querySelector('img, .image-wrapper');
      const hasTable = selectedContent.querySelector('table, .table-wrapper');
      
      if ((hasImage || hasTable) && (e.inputType === 'deleteContent' || e.inputType === 'deleteContentBackward')) {
        e.preventDefault();
        return;
      }
    };

    // keydown 이벤트로 Delete/Backspace 키로 삭제 방지
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        
        // 선택된 영역에 이미지나 표가 포함되어 있는지 확인
        const selectedContent = range.cloneContents();
        const hasImage = selectedContent.querySelector('img, .image-wrapper');
        const hasTable = selectedContent.querySelector('table, .table-wrapper');
        
        // 커서 앞뒤에 이미지나 표가 있는지 확인
        let node = range.startContainer;
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('image-wrapper') || 
                node.classList?.contains('table-wrapper') ||
                node.tagName === 'IMG' ||
                node.tagName === 'TABLE' ||
                node.closest('.image-wrapper') ||
                node.closest('.table-wrapper')) {
              e.preventDefault();
              return;
            }
          }
          node = node.parentNode;
        }

        if (hasImage || hasTable) {
          e.preventDefault();
          return;
        }

        // 커서 앞뒤의 노드 확인
        const startNode = range.startContainer;
        const startOffset = range.startOffset;
        
        // 앞의 노드 확인
        if (startNode.nodeType === Node.TEXT_NODE && startOffset === 0) {
          const prevSibling = startNode.previousSibling;
          if (prevSibling && (
            prevSibling.classList?.contains('image-wrapper') ||
            prevSibling.classList?.contains('table-wrapper') ||
            prevSibling.tagName === 'IMG' ||
            prevSibling.tagName === 'TABLE'
          )) {
            e.preventDefault();
            return;
          }
        }

        // 뒤의 노드 확인
        if (startNode.nodeType === Node.TEXT_NODE && startOffset === startNode.textContent.length) {
          const nextSibling = startNode.nextSibling;
          if (nextSibling && (
            nextSibling.classList?.contains('image-wrapper') ||
            nextSibling.classList?.contains('table-wrapper') ||
            nextSibling.tagName === 'IMG' ||
            nextSibling.tagName === 'TABLE'
          )) {
            e.preventDefault();
            return;
          }
        }
      }
    };

    // MutationObserver로 이미지/표 삭제 감지 및 복구
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 이미지 래퍼가 삭제된 경우
            if (node.classList?.contains('image-wrapper') || node.querySelector('.image-wrapper')) {
              const wrapper = node.classList?.contains('image-wrapper') ? node : node.querySelector('.image-wrapper');
              const img = wrapper?.querySelector('img');
              if (img && editor.contains(editor)) {
                // 삭제된 이미지를 복구
                setTimeout(() => {
                  if (!editor.querySelector(`img[src="${img.src}"]`)) {
                    editor.appendChild(wrapper);
                  }
                }, 0);
              }
            }
            
            // 표 래퍼가 삭제된 경우
            if (node.classList?.contains('table-wrapper') || node.querySelector('.table-wrapper')) {
              const wrapper = node.classList?.contains('table-wrapper') ? node : node.querySelector('.table-wrapper');
              const table = wrapper?.querySelector('table');
              if (table && editor.contains(editor)) {
                // 삭제된 표를 복구
                setTimeout(() => {
                  if (!editor.querySelector(`table[data-table-id="${table.getAttribute('data-table-id')}"]`)) {
                    editor.appendChild(wrapper);
                  }
                }, 0);
              }
            }
          }
        });
      });
    });

    observer.observe(editor, {
      childList: true,
      subtree: true
    });
    
    // 주기적으로 요소 저장
    const saveInterval = setInterval(() => {
      const images = editor.querySelectorAll('.image-wrapper');
      const tables = editor.querySelectorAll('.table-wrapper');
      // 요소 저장 로직은 필요시 추가
    }, 1000);

    editor.addEventListener('beforeinput', handleBeforeInput);
    editor.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      if (saveInterval) clearInterval(saveInterval);
      editor.removeEventListener('beforeinput', handleBeforeInput);
      editor.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 이미지 드래그 앤 드롭
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleDragStart = (e) => {
      if (e.target.closest('.resize-handle') || e.target.closest('.image-delete-btn')) {
        e.preventDefault();
        return;
      }
      if (e.target.tagName === 'IMG' && e.target.hasAttribute('data-attachment-id')) {
        setDraggedItem(e.target.getAttribute('data-attachment-id'));
        e.dataTransfer.effectAllowed = 'move';
        const wrapper = e.target.closest('.image-wrapper');
        if (wrapper) {
          wrapper.style.opacity = '0.5';
        } else {
          e.target.style.opacity = '0.5';
        }
      }
    };

    const handleDragEnd = (e) => {
      if (e.target.tagName === 'IMG') {
        const wrapper = e.target.closest('.image-wrapper');
        if (wrapper) {
          wrapper.style.opacity = '1';
        } else {
          e.target.style.opacity = '1';
        }
      }
      setDraggedItem(null);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
      e.preventDefault();
      if (!draggedItem) return;

      const draggedElement = editor.querySelector(`img[data-attachment-id="${draggedItem}"]`);
      if (!draggedElement) return;
      
      const imageWrapper = draggedElement.closest('.image-wrapper');
      if (!imageWrapper) return;

      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.clientX, e.clientY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }

      if (range) {
        const container = range.commonAncestorContainer;
        let insertNode = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
        
        if (!editor.contains(insertNode)) {
          insertNode = editor;
        }

        imageWrapper.remove();

        if (insertNode === editor) {
          editor.appendChild(imageWrapper);
        } else {
          try {
            insertNode.parentNode.insertBefore(imageWrapper, insertNode.nextSibling);
          } catch (err) {
            editor.appendChild(imageWrapper);
          }
        }

        const newRange = document.createRange();
        newRange.setStartAfter(imageWrapper);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      setDraggedItem(null);
    };

    editor.addEventListener('dragstart', handleDragStart);
    editor.addEventListener('dragend', handleDragEnd);
    editor.addEventListener('dragover', handleDragOver);
    editor.addEventListener('drop', handleDrop);

    return () => {
      editor.removeEventListener('dragstart', handleDragStart);
      editor.removeEventListener('dragend', handleDragEnd);
      editor.removeEventListener('dragover', handleDragOver);
      editor.removeEventListener('drop', handleDrop);
    };
  }, [draggedItem]);

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.put(`/notices/${noticeId}`, {
        title: title.trim(),
        content: content,
        attachments: attachments,
      });

      if (response.data.success) {
        alert('공지사항이 수정되었습니다.');
        navigate(`/community/notice/${noticeId}`);
      } else {
        alert(response.data.error || '공지사항 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 수정 오류:', error);
      alert(error.response?.data?.error || '공지사항 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="notice-create-page">
        <Header />
        <div className="notice-create-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="notice-create-page">
      <Header />
      <div className="notice-create-container">
        <div className="notice-create-content">
          <div className="page-header">
            <button
              className="btn-back"
              onClick={() => navigate(`/community/notice/${noticeId}`)}
            >
              목록으로
            </button>
            <h1 className="page-title">공지사항 수정</h1>
          </div>

          <form onSubmit={handleSubmit} className="notice-form">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                제목 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                내용 <span className="required">*</span>
              </label>
              
              {/* 툴바 */}
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <select
                    className="toolbar-select"
                    onChange={(e) => formatText('fontName', e.target.value)}
                    defaultValue=""
                  >
                    <option value="">글꼴 선택</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Palatino">Palatino</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Arial Black">Arial Black</option>
                    <option value="Impact">Impact</option>
                  </select>
                  
                  <select
                    className="toolbar-select"
                    onChange={(e) => formatText('fontSize', e.target.value)}
                    defaultValue=""
                  >
                    <option value="">글자크기</option>
                    <option value="1">8pt</option>
                    <option value="2">10pt</option>
                    <option value="3">12pt</option>
                    <option value="4">14pt</option>
                    <option value="5">18pt</option>
                    <option value="6">24pt</option>
                    <option value="7">36pt</option>
                  </select>
                  
                  <select
                    className="toolbar-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        applyLineHeight(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">줄간격</option>
                    <option value="1">1.0</option>
                    <option value="1.2">1.2</option>
                    <option value="1.5">1.5</option>
                    <option value="1.8">1.8</option>
                    <option value="2">2.0</option>
                    <option value="2.5">2.5</option>
                  </select>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('bold')}
                    title="굵게"
                  >
                    <i className="fas fa-bold"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('italic')}
                    title="기울임"
                  >
                    <i className="fas fa-italic"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('underline')}
                    title="밑줄"
                  >
                    <i className="fas fa-underline"></i>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('justifyLeft')}
                    title="텍스트 왼쪽 정렬"
                  >
                    <i className="fas fa-align-left"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('justifyCenter')}
                    title="텍스트 가운데 정렬"
                  >
                    <i className="fas fa-align-center"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('justifyRight')}
                    title="텍스트 오른쪽 정렬"
                  >
                    <i className="fas fa-align-right"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('justifyFull')}
                    title="텍스트 양쪽 정렬"
                  >
                    <i className="fas fa-align-justify"></i>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignImage('left')}
                    title="이미지 왼쪽 정렬"
                  >
                    <i className="fas fa-image"></i>
                    <i className="fas fa-align-left" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignImage('center')}
                    title="이미지 가운데 정렬"
                  >
                    <i className="fas fa-image"></i>
                    <i className="fas fa-align-center" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignImage('right')}
                    title="이미지 오른쪽 정렬"
                  >
                    <i className="fas fa-image"></i>
                    <i className="fas fa-align-right" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignTable('left')}
                    title="표 왼쪽 정렬"
                  >
                    <i className="fas fa-table"></i>
                    <i className="fas fa-align-left" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignTable('center')}
                    title="표 가운데 정렬"
                  >
                    <i className="fas fa-table"></i>
                    <i className="fas fa-align-center" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => alignTable('right')}
                    title="표 오른쪽 정렬"
                  >
                    <i className="fas fa-table"></i>
                    <i className="fas fa-align-right" style={{ fontSize: '0.7em', marginLeft: '2px' }}></i>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('insertUnorderedList')}
                    title="글머리 기호"
                  >
                    <i className="fas fa-list-ul"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => formatText('insertOrderedList')}
                    title="번호 매기기"
                  >
                    <i className="fas fa-list-ol"></i>
                  </button>
                </div>

                <div className="toolbar-group toolbar-color-group">
                  <div className="color-picker-wrapper">
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => {
                        setShowTextColorPicker(!showTextColorPicker);
                        setShowBgColorPicker(false);
                      }}
                      title="텍스트 색상"
                      style={{ position: 'relative' }}
                    >
                      <i className="fas fa-font"></i>
                      <span style={{ fontSize: '0.7em', marginLeft: '2px' }}>A</span>
                    </button>
                    {showTextColorPicker && (
                      <div className="color-picker-popup">
                        <div className="color-palette">
                          {colorPalette.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className="color-item"
                              style={{ backgroundColor: color }}
                              onClick={() => applyTextColor(color)}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="color-picker-custom">
                          <input
                            type="color"
                            onChange={(e) => applyTextColor(e.target.value)}
                            className="color-input"
                          />
                          <span>커스텀 색상</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="color-picker-wrapper">
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={() => {
                        setShowBgColorPicker(!showBgColorPicker);
                        setShowTextColorPicker(false);
                      }}
                      title="배경 색상"
                      style={{ position: 'relative' }}
                    >
                      <i className="fas fa-fill"></i>
                    </button>
                    {showBgColorPicker && (
                      <div className="color-picker-popup">
                        <div className="color-palette">
                          {colorPalette.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className="color-item"
                              style={{ backgroundColor: color }}
                              onClick={() => applyBgColor(color)}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="color-picker-custom">
                          <input
                            type="color"
                            onChange={(e) => applyBgColor(e.target.value)}
                            className="color-input"
                          />
                          <span>커스텀 색상</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={insertHorizontalRule}
                    title="구분선 추가"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={insertTable}
                    title="표 추가"
                  >
                    <i className="fas fa-table"></i>
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={handleImageUpload}
                    title="이미지 업로드"
                  >
                    <i className="fas fa-image"></i>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={handleVideoAdd}
                    title="동영상 추가"
                  >
                    <i className="fas fa-video"></i>
                  </button>
                </div>
              </div>

              {/* 에디터 */}
              <div
                ref={editorRef}
                className="editor-content"
                contentEditable
                suppressContentEditableWarning
                onFocus={(e) => {
                  const editor = e.target;
                  if (editor.textContent.trim() === '내용을 입력하세요...' || editor.innerHTML === '<p>내용을 입력하세요...</p>') {
                    editor.innerHTML = '<p><br></p>';
                    const range = document.createRange();
                    range.selectNodeContents(editor);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }}
                onBlur={(e) => {
                  const editor = e.target;
                  // 이미지, 표, 동영상이 있는지 확인
                  const hasImages = editor.querySelectorAll('img').length > 0;
                  const hasTables = editor.querySelectorAll('table').length > 0;
                  const hasVideos = editor.querySelectorAll('iframe').length > 0;
                  const hasAttachments = editor.querySelectorAll('a[data-attachment-id]').length > 0;
                  
                  if (!editor.textContent.trim() && !hasImages && !hasTables && !hasVideos && !hasAttachments) {
                    editor.innerHTML = '<p>내용을 입력하세요...</p>';
                    editor.style.color = '#999';
                  } else {
                    editor.style.color = '#2b2d42';
                  }
                }}
                onClick={(e) => {
                  // 삭제 버튼이나 리사이즈 핸들 클릭 시 이벤트 전파 중지
                  if (e.target.closest('.image-delete-btn') || 
                      e.target.closest('.table-delete-btn') ||
                      e.target.closest('.resize-handle') ||
                      e.target.closest('.table-resize-handle') ||
                      e.target.closest('.cell-width-handle') ||
                      e.target.closest('.cell-height-handle') ||
                      e.target.closest('.cell-corner-handle') ||
                      e.target.closest('.cell-color-btn')) {
                    e.stopPropagation();
                    return;
                  }
                }}
                onMouseDown={(e) => {
                  // 삭제 버튼이나 리사이즈 핸들 클릭 시 이벤트 전파 중지
                  if (e.target.closest('.image-delete-btn') || 
                      e.target.closest('.table-delete-btn') ||
                      e.target.closest('.resize-handle') ||
                      e.target.closest('.table-resize-handle') ||
                      e.target.closest('.cell-width-handle') ||
                      e.target.closest('.cell-height-handle') ||
                      e.target.closest('.cell-corner-handle') ||
                      e.target.closest('.cell-color-btn')) {
                    e.stopPropagation();
                    return;
                  }
                }}
              >
                <p>내용을 입력하세요...</p>
              </div>
            </div>

            {/* 파일 업로드 섹션 */}
            <div className="form-group file-upload-section">
              <label className="form-label">
                첨부 파일
              </label>
              <div className="file-upload-container">
                <button
                  type="button"
                  className="btn-file-upload"
                  onClick={handleFileUpload}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  파일 업로드
                </button>
                <p className="file-upload-hint">
                  최대 50MB까지 업로드 가능합니다.
                </p>
              </div>

              {/* 업로드된 파일 목록 */}
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files-list">
                  <h3 className="files-list-title">업로드된 파일 ({uploadedFiles.length})</h3>
                  <div className="files-grid">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="file-item">
                        <div className="file-icon">
                          <i className="fas fa-file"></i>
                        </div>
                        <div className="file-info">
                          <span className="file-name" title={file.originalName}>
                            {file.originalName}
                          </span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                        <button
                          type="button"
                          className="file-download-btn"
                          onClick={() => {
                            if (window.confirm('파일을 다운로드하시겠습니까?')) {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.originalName;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                          title="파일 다운로드"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                        <button
                          type="button"
                          className="file-delete-btn-list"
                          onClick={() => handleFileDelete(file.id)}
                          title="파일 삭제"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(`/community/notice/${noticeId}`)}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '수정 중...' : '수정하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NoticeEdit;

