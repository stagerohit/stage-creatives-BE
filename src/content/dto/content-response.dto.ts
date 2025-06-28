export interface ContentDetailResponse {
  show: {
    meta: {
      hin: {
        slug: string;
        title: string;
        description: string;
        trailer: {
          sourceLink: string;
        };
      };
    };
  };
  dialect: string;
}

export class CreateContentResponseDto {
  message: string;
  content_id: string;
  slug: string;
} 