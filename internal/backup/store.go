package backup

import (
	"bytes"
	"context"
	"io"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const (
	archivePrefix  = "skillbook-"
	archiveExt     = ".tar.gz"
	archiveTimeFmt = "20060102-150405"
)

// ArchiveInfo 概述一个历史归档（供列表展示）。
type ArchiveInfo struct {
	Name      string `json:"name"` // 去掉 key 前缀后的文件名
	Key       string `json:"-"`    // 完整对象 key
	Time      int64  `json:"time"` // Unix 秒，来自命名/对象时间
	Size      int64  `json:"size"`
	FileCount int    `json:"fileCount"` // 来自对象 metadata，缺失为 -1
}

// ArchiveStore 抽象对象存储，便于测试注入假实现。
type ArchiveStore interface {
	Put(ctx context.Context, key string, data []byte, meta map[string]string) error
	List(ctx context.Context) ([]ArchiveInfo, error) // 按时间倒序
	Get(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string) error
	Test(ctx context.Context) error
}

// archiveKey 构造归档对象 key。
func archiveKey(cfg Config, now time.Time) string {
	return cfg.EffectivePrefix() + archivePrefix + now.UTC().Format(archiveTimeFmt) + archiveExt
}

// parseArchiveTime 从文件名解析时间戳（Unix 秒）；失败返回 0。
func parseArchiveTime(name string) int64 {
	if !strings.HasPrefix(name, archivePrefix) || !strings.HasSuffix(name, archiveExt) {
		return 0
	}
	mid := strings.TrimSuffix(strings.TrimPrefix(name, archivePrefix), archiveExt)
	tm, err := time.ParseInLocation(archiveTimeFmt, mid, time.UTC)
	if err != nil {
		return 0
	}
	return tm.Unix()
}

// validArchiveName 校验归档名是纯文件名且符合命名（防路径逃逸）。
func validArchiveName(name string) bool {
	if strings.ContainsAny(name, "/\\") || strings.Contains(name, "..") {
		return false
	}
	return strings.HasPrefix(name, archivePrefix) && strings.HasSuffix(name, archiveExt)
}

// s3Store 用 minio-go 实现 ArchiveStore。
type s3Store struct {
	cli    *minio.Client
	bucket string
	prefix string
}

// newS3Store 按配置构造 S3 客户端。
func newS3Store(cfg Config) (ArchiveStore, error) {
	cli, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, err
	}
	return &s3Store{cli: cli, bucket: cfg.Bucket, prefix: cfg.EffectivePrefix()}, nil
}

func (s *s3Store) Put(ctx context.Context, key string, data []byte, meta map[string]string) error {
	_, err := s.cli.PutObject(ctx, s.bucket, key, bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: "application/gzip", UserMetadata: meta})
	return err
}

func (s *s3Store) List(ctx context.Context) ([]ArchiveInfo, error) {
	var out []ArchiveInfo
	for obj := range s.cli.ListObjects(ctx, s.bucket, minio.ListObjectsOptions{
		Prefix: s.prefix, Recursive: true, WithMetadata: true,
	}) {
		if obj.Err != nil {
			return nil, obj.Err
		}
		name := strings.TrimPrefix(obj.Key, s.prefix)
		if !validArchiveName(name) {
			continue
		}
		ts := parseArchiveTime(name)
		if ts == 0 {
			ts = obj.LastModified.Unix()
		}
		out = append(out, ArchiveInfo{
			Name:      name,
			Key:       obj.Key,
			Time:      ts,
			Size:      obj.Size,
			FileCount: metaFileCount(obj.UserMetadata),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Time > out[j].Time })
	return out, nil
}

func (s *s3Store) Get(ctx context.Context, key string) ([]byte, error) {
	obj, err := s.cli.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, err
	}
	defer obj.Close()
	return io.ReadAll(obj)
}

func (s *s3Store) Delete(ctx context.Context, key string) error {
	return s.cli.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

func (s *s3Store) Test(ctx context.Context) error {
	_, err := s.cli.BucketExists(ctx, s.bucket)
	return err
}

// metaFileCount 从对象 user-metadata 里取 filecount（大小写不敏感），缺失返回 -1。
func metaFileCount(m map[string]string) int {
	for k, v := range m {
		if strings.EqualFold(strings.TrimPrefix(k, "X-Amz-Meta-"), "filecount") {
			if n, err := strconv.Atoi(v); err == nil {
				return n
			}
		}
	}
	return -1
}
