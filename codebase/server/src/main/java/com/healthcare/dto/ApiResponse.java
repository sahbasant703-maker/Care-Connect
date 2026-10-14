package com.healthcare.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard API response wrapper.
 * All controller endpoints must return this format per project standards.
 *
 * @param <T> response data type
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    /**
     * Create a successful response with data.
     *
     * @param message success message
     * @param data response data
     * @param <T> data type
     * @return ApiResponse with success=true
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Create a successful response with only a message.
     *
     * @param message success message
     * @param <T> data type
     * @return ApiResponse with success=true, no data
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Create an error response with optional details.
     *
     * @param message error message
     * @param <T> data type
     * @return ApiResponse with success=false
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }

    /**
     * Create an error response with additional error details.
     *
     * @param message error message
     * @param data error details (validation errors, etc.)
     * @param <T> data type
     * @return ApiResponse with success=false
     */
    public static <T> ApiResponse<T> error(String message, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .build();
    }
}