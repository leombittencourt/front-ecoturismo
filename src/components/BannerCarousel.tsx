import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient, type BannerDto } from '@/services/apiClient';

interface Banner {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagem_url: string;
  link: string | null;
  ordem: number;
}

function mapBannerDto(dto: BannerDto): Banner {
  return {
    id: dto.id,
    titulo: dto.titulo ?? null,
    subtitulo: dto.subtitulo ?? null,
    imagem_url: (dto.imagem_url ?? dto.imagemUrl ?? '') as string,
    link: dto.link ?? null,
    ordem: dto.ordem ?? 0,
  };
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    let cancelled = false;

    apiClient
      .listarBanners(true)
      .then((data) => {
        if (!cancelled) {
          setBanners(
            data
              .map(mapBannerDto)
              .filter((b) => Boolean(b.imagem_url))
              .sort((a, b) => a.ordem - b.ordem)
          );
        }
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (!emblaApi || banners.length <= 1) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi, banners.length]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  const Wrapper = ({ children, link }: { children: React.ReactNode; link: string | null }) =>
    link ? (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    ) : (
      <>{children}</>
    );

  return (
    <div className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((b) => (
            <div key={b.id} className="flex-[0_0_100%] min-w-0 relative">
              <Wrapper link={b.link}>
                <div className="relative h-[60vh]">
                  <img
                    src={b.imagem_url}
                    alt={b.titulo || 'Banner'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {(b.titulo || b.subtitulo) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 sm:p-6">
                      <div>
                        {b.titulo && (
                          <h2 className="text-lg sm:text-2xl font-heading font-bold text-white drop-shadow-md">
                            {b.titulo}
                          </h2>
                        )}
                        {b.subtitulo && (
                          <p className="text-sm sm:text-base text-white/90 mt-1 drop-shadow-md">
                            {b.subtitulo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Wrapper>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === selectedIndex ? 'bg-white w-5' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
